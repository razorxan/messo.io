import http from 'http';
import https from 'https';
import { URL } from 'url';
import { EventEmitter } from 'events'
import { Socket } from 'net';
import Peer from './Peer';
import Channel from './Channel';
import Ack from '../shared/Ack';
import { AuthenticationMiddleware } from './types';
import Response from '../shared/Response';
import ServerOptions from './interfaces/ServerOptions';


class Server extends EventEmitter {

    private _channels: Map<string, Channel>;
    private _server: http.Server | https.Server;
    private _port: number;
    public readonly requestTimeout: number;

    constructor(options: ServerOptions) {
        super();
        if (options.server) {
            this._server = options.server;
            const address = options.server.address();
            if (typeof address === 'object' && address !== null) {
                this._port = address.port;
            } else {
                throw new Error("Cannot get listening port on provided server");
            }
        } else {
            this._port = options.port || 3000;
            this._server = new http.Server();
            this._server.listen(this._port, () => {
                console.log(`Messo Server Listening on port ${this._port}}`);
            });
        }
        this.requestTimeout = options.requestTimeout || 5000;
        this._channels = new Map<string, Channel>();
        this.handleEvents();
    }

    private handleEvents(): void {
        this._server.on('upgrade', async (request: http.IncomingMessage, socket: Socket, head: any) => {
            const requestUrl = request.url ?? "";
            const uri: URL = new URL(requestUrl, `http://${request.headers.host}`);
            const channelName: string = uri.pathname ?? '/';
            const channel = this.channel(channelName);
            channel.handle(request, socket, head);
        });
    }

    public channel(name: string): Channel {
        let channel: Channel | undefined = this._channels.get(name);
        if (channel === undefined) {
            channel = new Channel(name, { requestTimeout: this.requestTimeout });
            channel.on('connection', (peer: Peer) => {
                this.emit('connection', peer, channel!.name);
            });
            this._channels.set(name, channel);
        }
        return channel;
    }

    public chan = this.channel.bind(this);
    public of = this.channel.bind(this);

    public use(authenticate: AuthenticationMiddleware): this {
        this.channel('/').use(authenticate);
        return this;
    }

    public request(peerId: string, event: string, body: any): Promise<Response> {
        return this.channel('/').request(peerId, event, body);
    }

    public join(peerId: string, roomId: string): this {
        this.channel('/').join(peerId, roomId);
        return this;
    }

    public leave(peerId: string, roomId: string): this {
        this.channel('/').leave(peerId, roomId);
        return this;
    }

    public send(peerId: string, event: string, body: any): Promise<Ack> {
        return this.channel('/').send(peerId, event, body);
    }

    public sendToRoom(roomId: string, event: string, body: any): this {
        this.channel('/').sendToRoom(roomId, event, body);
        return this
    }

}

export default Server;