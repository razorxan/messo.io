
import http from 'http';
import { Socket as NetSocket } from 'net';
import ws from 'ws';
import { EventEmitter } from 'events';
import Room from './Room'
import Peer from './Peer';
import Collection from './Collection';
import Socket from './Socket';
import Meta from './interfaces/Meta';
import ChannelOptions from './interfaces/ChannelOptions';
import Ack from '../shared/Ack';
import Response from '../shared/Response';
import { AuthenticationMiddleware } from './types'

class Channel extends EventEmitter {

    private _server: ws.Server;
    private _name: string;
    private _peers: Collection;
    private _rooms: Map<string, Room>;
    private _authenticate: AuthenticationMiddleware;
    public readonly _requestTimeout: number | undefined;

    constructor(name: string = '/', options: ChannelOptions) {
        super();
        this._server = new ws.Server({ noServer: true });
        this._name = name;
        this._peers = new Collection();
        this._rooms = new Map<string, Room>();
        this._authenticate = async () => ({ meta: {}, peer: () => false });
        this._requestTimeout = options.requestTimeout;
    }

    get name(): string {
        return this._name;
    }

    public use(authenticate: AuthenticationMiddleware): this {
        this._authenticate = authenticate;
        return this;
    }

    private parseCookies(request: http.IncomingMessage): any {
        const list: any = {};
        const cookies = request.headers.cookie;
        if (!cookies) return [];
        cookies.split(";").forEach((cookie: string) => {
            const parts: string[] | null = cookie.match(/(.*?)=(.*)$/);
            if (parts && parts.length === 2) {
                const key: string = parts[0];
                const value: string = parts[1];
                list[key] = value;
            }
        });
        return list;
    }

    public async handle(request: http.IncomingMessage, socket: NetSocket, head: any): Promise<void> {
        const requestUrl: string = request.url ?? "";
        const uri: URL = new URL(requestUrl, `http://${request.headers.host}`);
        const searchParams: URLSearchParams = uri.searchParams;
        const query: any = {};
        searchParams.forEach((value: string, key: string) => {
            query[key] = value;
        });
        const headers = request.headers;
        const cookies = this.parseCookies(request);
        try {
            try {
                const result: Meta = await this._authenticate(query, headers, cookies);
                this._server.handleUpgrade(request, socket, head, (ws: ws) => {
                    const peer = new Peer(this, new Socket(ws), result);
                    peer.on('event:close', (_: any) => {
                        this._peers.delete(peer.id);
                    });
                    this._peers.push(peer);
                    this.emit('connection', peer);
                });
            } catch (error) {
                this._server.handleUpgrade(request, socket, head, (ws: ws) => {
                    ws.close(400);
                });
            }
        } catch (e) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    }

    public peer(id: string): Peer | undefined {
        return this._peers.get(id);
    }

    request(peerId: string, event: string, body: any): Promise<Response> {
        const peer = this._peers.get(peerId);
        if (!peer) throw new Error(`Cannot send request to peer with id ${peerId} does not exist.`);
        return peer.request(event, body)
    }

    send(peerId: string, event: string, data: any): Promise<Ack> {
        const peer = this._peers.get(peerId);
        if (!peer) throw new Error(`Cannot send to peer with id ${peerId} does not exist.`);
        return peer.send(event, data);
    }

    join(peerId: string, roomId: string): this {
        if (!this._peers.has(peerId)) throw new Error(`Cannot join. Peer with id ${peerId} does not exist.`);
        const room: Room = this._rooms.has(roomId) ? this._rooms.get(roomId)! : new Room(this, roomId);
        room.addPeerId(peerId);
        return this;
    }

    leave(peerId: string, roomId: string): this {
        if (!this._peers.has(peerId)) throw new Error(`Cannot leave room ${roomId}. Peer with id ${peerId} does not exist.`);
        if (!this._rooms.has(roomId)) throw new Error(`Cannot leave room with id ${roomId}. The room does not exist`);
        const room: Room = this._rooms.get(roomId)!;
        room.removePeerId(peerId);
        if (room.empty) this._rooms.delete(roomId);
        return this;
    }

    public to(roomId: string) {
        return this._rooms.get(roomId);
    }

    public sendToRoom(roomId: string, event: string, body: any): this {
        const room = this._rooms.get(roomId);
        if (room) {
            room.send(event, body);
            return this;
        }
        throw new Error(`Cannnot send to room with id ${room}. The room does not exists.`)
    }

    get peers(): Collection {
        return this._peers;
    }

}

export default Channel;