import { EventEmitter } from 'events';
import { parse as parseUrl } from 'url';
import querystring from 'querystring';
import http from 'http';
import { Socket } from 'net';

import ws from 'ws';
import { v4 as uuidv4, v4 } from 'uuid';

import MessoRoom from './MessoRoom';
import MessoPeer from './MessoPeer';

import MessoPeerAuth from './interfaces/MessoPeerAuth.interface';
import MessoCollection from './MessoCollection';


type MessoAuthenticationMiddlware = (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, request: http.IncomingMessage) => Promise<MessoPeerAuth>;
class MessoChannel extends EventEmitter {

    private _server: ws.Server;
    private _name: string;
    private _peers: MessoCollection;
    private _rooms: Map<string, MessoRoom>;
    private _authenticate: MessoAuthenticationMiddlware;

    constructor(name: string = '/') {
        super();
        this._server = new ws.Server({ noServer: true });
        this._name = name;
        this._peers = new MessoCollection();
        this._rooms = new Map<string, MessoRoom>();
        this._authenticate = async () => ({ id: uuidv4(), meta: {} });
    }

    get name(): string {
        return this._name;
    }

    public use(authenticate: (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, request: http.IncomingMessage) => Promise<MessoPeerAuth>): this {
        this._authenticate = authenticate;
        return this;
    }

    public async handle(request: http.IncomingMessage, socket: Socket, head: any): Promise<void> {
        const requestUrl: string = request.url ?? "";
        const qs = parseUrl(requestUrl).query;
        let query: querystring.ParsedUrlQuery = {};
        if (qs) query = querystring.parse(qs);
        try {
            const { id, meta } = await this._authenticate(query, request.headers, request);
            this._server.handleUpgrade(request, socket, head, (ws: ws) => {
                let peer: MessoPeer;
                if (this._peers.has(id)) {
                    peer = this._peers.get(id)!;
                    peer.addSocket(ws);
                } else {
                    peer = new MessoPeer(this, id, meta);
                    peer.on('close', id => {
                        this._peers.delete(peer.id);
                    })
                    this._peers.push(peer);
                    peer.addSocket(ws);
                    this.emit('connection', peer);
                }
            });
        } catch (e) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    }

    public peer(id: string): MessoPeer | undefined {
        return this._peers.get(id);
    }

    request(peerId: string, event: string, data: any): Promise<any>;
    request(peerId: string, event: string, data: any, callback: Function): MessoPeer;
    request(peerId: string, event: string, data: any, callback?: Function): Promise<any> | MessoPeer {
        const peer = this._peers.get(peerId);
        if (!peer) throw new Error(`Cannot send request to peer with id ${peerId} does not exist.`);
        return callback ? peer.request(event, data, callback) : peer.request(event, data)
    }

    join(peerId: string, roomId: string): this {
        if (!this._peers.has(peerId)) throw new Error(`Cannot join. Peer with id ${peerId} does not exist.`);
        const room: MessoRoom = this._rooms.has(roomId) ? this._rooms.get(roomId)! : new MessoRoom(this, roomId);
        room.addPeerId(peerId);
        return this;
    }

    leave(peerId: string, roomId: string): this {
        if (!this._peers.has(peerId)) throw new Error(`Cannot leave room ${roomId}. Peer with id ${peerId} does not exist.`);
        if (!this._rooms.has(roomId)) throw new Error(`Cannot leave room with id ${roomId}. The room does not exist`);
        const room: MessoRoom = this._rooms.get(roomId)!;
        room.removePeerId(peerId);
        if (room.empty) this._rooms.delete(roomId);
        return this;
    }

    send(peerId: string, event: string, data: any, type: string = 'message'): this {
        const peer = this._peers.get(peerId);
        if (!peer) throw new Error(`Cannot send to peer with id ${peerId} does not exist.`);
        peer.send(event, data);
        return this;
    }

    sendToRoom(roomId: string, event: string, ...args: any): this {
        const room = this._rooms.get(roomId);
        if (room) {
            room.send(event, ...args);
            return this;
        }
        throw new Error(`Cannnot send to room with id ${room}. The room does not exists.`)
    }

    get peers(): MessoCollection {
        return this._peers;
    }

}

export default MessoChannel;