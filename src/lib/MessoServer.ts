import http from 'http';
import https from 'https';
import { parse as parseUrl } from 'url';
import { EventEmitter } from 'events';
import { Socket } from 'net';
import {
    MessoPeer,
    MessoChannel,
    IMessoServerOptions,
    MessoAuthenticationMiddleware,
    MessoAck,
    MessoResponse
} from './';

class MessoServer extends EventEmitter {

    private _channels: Map<string, MessoChannel>;
    private _server: http.Server | https.Server;
    private _port: number;

    constructor(options: IMessoServerOptions) {
        super();
        if (options.server) {
            this._server = options.server;
        } else {
            this._port = options.port || 3000;
            this._server = new http.Server();
            this._server.listen(this._port, () => {
                console.log(`Messo Server Listening on port ${this._port}}`);
            });
        }
        this._channels = new Map<string, MessoChannel>();
        this.handleEvents();
    }

    private handleEvents(): void {
        this._server.on('upgrade', async (request: http.IncomingMessage, socket: Socket, head: any) => {
            const requestUrl = request.url ?? ""
            const channelName: string | null = parseUrl(requestUrl).pathname ?? '/';
            const channel = this.channel(channelName);
            channel.handle(request, socket, head);
        });
    }


    public channel(name: string): MessoChannel {
        let channel: MessoChannel | undefined = this._channels.get(name);
        if (channel === undefined) {
            channel = new MessoChannel(name);
            channel.on('connection', (peer: MessoPeer) => {
                this.emit('connection', peer, channel!.name);
            });
            this._channels.set(name, channel);
        }

        return channel;
    }

    public chan = this.channel.bind(this);

    public use(authenticate: MessoAuthenticationMiddleware): this {
        this.channel('/').use(authenticate);
        return this;
    }

    public request(peerId: string, event: string, body: any): Promise<MessoResponse> {
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

    public send(peerId: string, event: string, data: any): Promise<MessoAck> {
        return this.channel('/').send(peerId, event, data);
    }

    public sendToRoom(roomId: string, event: string, ...args: any): this {
        this.channel('/').sendToRoom(roomId, event, ...args);
        return this
    }

}

export default MessoServer;