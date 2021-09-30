
import http from 'http';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import ws from 'ws';
import {
    IMessoMeta,
    MessoRoom,
    MessoPeer,
    MessoCollection,
    MessoAuthenticationMiddleware,
    MessoAck,
    MessoResponse
} from './';

class MessoChannel extends EventEmitter {

    private _server: ws.Server;
    private _name: string;
    private _peers: MessoCollection;
    private _rooms: Map<string, MessoRoom>;
    private _authenticate: MessoAuthenticationMiddleware;

    constructor(name: string = '/') {
        super();
        this._server = new ws.Server({ noServer: true });
        this._name = name;
        this._peers = new MessoCollection();
        this._rooms = new Map<string, MessoRoom>();
        this._authenticate = async () => ({ meta: {}, peer: () => false });
    }

    get name(): string {
        return this._name;
    }

    public use(authenticate: MessoAuthenticationMiddleware): this {
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

    public async handle(request: http.IncomingMessage, socket: Socket, head: any): Promise<void> {
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
                const result: IMessoMeta = await this._authenticate(query, headers, cookies);
                this._server.handleUpgrade(request, socket, head, (ws: ws) => {
                    const peer = new MessoPeer(this, ws, result);
                    peer.on('event', 'close', (_: any) => {
                        this._peers.delete(peer.id);
                    });
                    this._peers.push(peer);
                    this.emit('connection', peer);
                });
            } catch (error) {
                console.log(error);
                this._server.handleUpgrade(request, socket, head, (ws: ws) => {
                    ws.close(400);
                });
            }
        } catch (e) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    }

    public peer(id: string): MessoPeer | undefined {
        return this._peers.get(id);
    }

    request(peerId: string, event: string, body: any): Promise<MessoResponse> {
        const peer = this._peers.get(peerId);
        if (!peer) throw new Error(`Cannot send request to peer with id ${peerId} does not exist.`);
        return peer.request(event, body)
    }

    send(peerId: string, event: string, data: any): Promise<MessoAck> {
        const peer = this._peers.get(peerId);
        if (!peer) throw new Error(`Cannot send to peer with id ${peerId} does not exist.`);
        return peer.send(event, data);
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

    get peers(): MessoCollection {
        return this._peers;
    }

}

export default MessoChannel;