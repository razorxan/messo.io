import { EventEmitter } from 'events';
import url from 'url';
import ws from 'ws';
import http from 'http';
import https from 'https';
import { Socket } from 'net';
import querystring from 'querystring';

import Messo from './lib/Messo';




interface MessoUserAuth {
    id: string | number;
    [key: string]: any;
};

interface MessoServerOptions {
    host?: string;
    port?: number;
    server: http.Server | https.Server,
    path?: string;
    authenticate: (query: any, headers: http.IncomingHttpHeaders, request: http.IncomingMessage) => Promise<MessoUserAuth>;
};


class MessoServer extends EventEmitter {

    server: ws.Server;
    users: Record<number, Messo>
    httpServer: http.Server | https.Server;
    authenticate: (query: any, headers: http.IncomingHttpHeaders, request: http.IncomingMessage) => Promise<MessoUserAuth>;

    constructor(options: MessoServerOptions) {
        super();
        this.httpServer = options.server;
        this.authenticate = options.authenticate;
        this.server = new ws.Server({ noServer: true });
        this.handleEvents();
    }

    handleEvents() {
        if (this.authenticate) {
            this.httpServer.on('upgrade', async (request: http.IncomingMessage, socket: Socket, head: any) => {
                try {
                    let query: querystring.ParsedUrlQuery = {};
                    if (request.url) {
                        const qs = url.parse(request.url).query;
                        if (qs !== null) {
                            query = querystring.parse(qs);
                        }
                    }
                    const auth = await this.authenticate(query, request.headers, request);
                    this.server.handleUpgrade(request, socket, head, (ws: ws) => {
                        this.server.emit('connection', ws, request, auth);
                    })
                } catch (error) {
                    socket.write('HTTP/1.1 401 Unahthorized\r\n\n');
                }
            });
        }
        this.server.on("connection", (socket: ws, request: http.IncomingMessage, auth?: any) => {
            const user = new Messo();
        });
    }

}

const server = new http.Server()

server.listen(80);

const a: MessoServer = new MessoServer({
    server: server,
    authenticate: (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, request: http.IncomingMessage) => {
        return new Promise((resolve, reject) => {
            resolve({ id: 1, ciao: 'come stai', prova: 'ciao' });
        });
    }
});

a.on('connection', user => {
    console.log(user)
});