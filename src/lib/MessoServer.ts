import ws from 'ws';
import http from 'http';
import https from 'https';
import querystring from 'querystring';
import { parse as parseUrl } from 'url';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

import Messo from './Messo';
import MessoRoom from './MessoRoom';

import MessoServerOptions from './interfaces/MessoServerOptions.interface';
import MessoPeerAuth from './interfaces/MessoPeerAuth.interface'
import MessoAck from './interfaces/MessoAck.interface'

class MessoServer extends EventEmitter {


    peers: Map<string, Messo>;
    rooms: Map<string, MessoRoom>;
    server: ws.Server;
    httpServer: http.Server | https.Server;
    path: string | undefined;
    port: number | undefined;
    host: string | undefined;
    acks: Map<string, MessoAck>;
    authenticate: (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, request: http.IncomingMessage) => Promise<MessoPeerAuth>;

    constructor(options: MessoServerOptions) {
        super();
        /**
         * If server is not set in options create one
         * if path is not specified set it to '/' 
         */
        this.httpServer = options.server;
        this.authenticate = options.authenticate;
        this.path = options.path;
        this.port = options.port;
        this.host = options.host;
        this.server = new ws.Server({ noServer: true });
        this.acks = new Map<string, MessoAck>();
        this.peers = new Map<string, Messo>();
        this.rooms = new Map<string, MessoRoom>();
        this.handleEvents();
    }

    handleEvents() {
        this.httpServer.on('upgrade', async (request: http.IncomingMessage, socket: Socket, head: any) => {
            const requestUrl = request.url ?? ""
            let pathname: string | null = parseUrl(requestUrl).pathname;
            if (this.path === undefined || pathname === this.path) {
                await this.handleRequest(request, socket, head);
            } else {
                socket.write('HTTP/1.1 402 Unahthorized\r\n\n');
                socket.destroy();
            }
        });
        this.server.on('connection', (socket: ws, request: http.IncomingMessage, auth?: any) => {
            let messo: Messo;
            if (this.peers.has(auth.id)) {
                messo = this.peers.get(auth.id)!;
                messo.addSocket(socket);
            } else {
                messo = new Messo(this, auth.id);
                messo.on('close', id => {
                    this.peers.delete(messo.id);
                })
                this.peers.set(messo.id, messo);
                messo.addSocket(socket);
                this.emit('connection', messo);
            }
        });
    }

    request(peerId: string, event: string, data: any, callback?: Function): Promise<any> {
        const peer = this.peers.get(peerId);
        if (!peer) throw new Error(`Cannot send request to peer with id ${peerId} does not exist.`);
        return peer.request(event, data, callback);
    }

    join(peerId: string, roomId: string): MessoServer {
        if (!this.peers.has(peerId)) throw new Error(`Cannot join. Peer with id ${peerId} does not exist.`);
        const room: MessoRoom = this.rooms.has(roomId) ? this.rooms.get(roomId)! : new MessoRoom(this, roomId);
        room.addPeerId(peerId);
        return this;
    }

    leave(peerId: string, roomId: string): MessoServer {
        if (!this.peers.has(peerId)) throw new Error(`Cannot leave room ${roomId}. Peer with id ${peerId} does not exist.`);
        if (!this.rooms.has(roomId)) throw new Error(`Cannot leave room with id ${roomId}. The room does not exist`);
        const room: MessoRoom = this.rooms.get(roomId)!;
        room.removePeerId(peerId);
        //TODO: Let's think about it
        if (room.peerIds.length === 0) this.rooms.delete(roomId);
        return this;
    }

    send(peerId: string, event: string, data: any, type: string = 'message'): MessoServer {
        const peer = this.peers.get(peerId);
        if (!peer) throw new Error(`Cannot send to peer with id ${peerId} does not exist.`);
        peer.send(event, data);
        return this;
    }

    sendToRoom(roomId: string, event: string, ...args: any) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.send(event, ...args);
            return this;
        }
        throw new Error(`Cannnot send to room with id ${room}. The room does not exists.`)
    }

    getPeers(ids: string[] | undefined): Messo[] {
        if (ids && ids.length > 0) {
            return [...this.peers].map(([_, peer]: [string, Messo]) => peer).filter((peer: Messo) => {
                return ids.includes(peer.id)
            });
        }
        return [...this.peers].map(([id, peer]: [string, Messo]) => peer);
    }

    async handleRequest(request: http.IncomingMessage, socket: Socket, head: any): Promise<MessoServer> {
        try {
            const requestUrl: string = request.url ?? "";
            const qs = parseUrl(requestUrl).query;
            let query: querystring.ParsedUrlQuery = {};
            if (qs) query = querystring.parse(qs);
            const auth = await this.authenticate(query, request.headers, request);;
            this.server.handleUpgrade(request, socket, head, (ws: ws) => {
                this.server.emit('connection', ws, request, auth);
            });
            return this;
        } catch (error) {
            socket.write('HTTP/1.1 401 Unahthorized\r\n\n');
            socket.destroy();
            return this;
        }
    }


}

export default MessoServer;