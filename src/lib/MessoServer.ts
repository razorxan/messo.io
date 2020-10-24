import ws from 'ws';
import http from 'http';
import https from 'https';
import querystring from 'querystring';
import { parse as parseUrl } from 'url';
import { EventEmitter } from 'events';

import Messo from './Messo';
import MessoChannel from './MessoChannel';
import MessoRoom from './MessoRoom';
import { Socket } from 'net';

import MessoServerOptions from './interfaces/MessoServerOptions.interface';
import MessoPeerAuth from './interfaces/MessoPeerAuth.interface';
import MessoAck from './interfaces/MessoAck.interface';

class MessoServer extends EventEmitter {

    private _channels: Map<string, MessoChannel>;
    public httpServer: http.Server | https.Server;
    // private port: number | undefined;
    // private host: string | undefined;

    private _authenticate: (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, request: http.IncomingMessage) => Promise<MessoPeerAuth>;

    constructor(options: MessoServerOptions) {
        super();
        /**
         * If server is not set in options create one
         * if path is not specified set it to '/' 
         */
        this.httpServer = options.server;
        // this.port = options.port;
        // this.host = options.host;

        this._channels = new Map<string, MessoChannel>();
        this.handleEvents();
    }

    private handleEvents(): void {

        this.httpServer.on('upgrade', async (request: http.IncomingMessage, socket: Socket, head: any) => {
            const requestUrl = request.url ?? ""
            const channelName: string | null = parseUrl(requestUrl).pathname ?? '/';
            const channel = this.channel(channelName);
            channel.handle(request, socket, head);
        });
    }


    public channel(name: string): MessoChannel {
        let channel: MessoChannel | undefined = this._channels.get(name);
        if (!channel) {
            channel = new MessoChannel(name);
            this._channels.set(name, channel);
        }
        channel.on('connection', (peer: Messo) => {
            this.emit('connection', peer, channel!.name);
        });
        return channel;
    }

    public chan = this.channel.bind(this);

    public request(peerId: string, event: string, data: any): Promise<any>;
    public request(peerId: string, event: string, data: any, callback: Function): Messo;
    public request(peerId: string, event: string, data: any, callback?: Function): Promise<any> | Messo {
        return this.channel('/').request(peerId, event, data, callback!);
    }

    public join(peerId: string, roomId: string): MessoServer {
        this.channel('/').join(peerId, roomId);
        return this;
    }

    public leave(peerId: string, roomId: string): MessoServer {
        this.channel('/').leave(peerId, roomId);
        return this;
    }

    public send(peerId: string, event: string, data: any, type: string = 'message'): MessoServer {
        this.channel('/').send(event, data, type);
        return this;
    }

    public sendToRoom(roomId: string, event: string, ...args: any): MessoServer {
        this.channel('/').sendToRoom(roomId, event, ...args);
        return this
    }

}

export default MessoServer;