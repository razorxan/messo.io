import http from 'http';
import { ParsedUrlQuery } from 'querystring';
import {
    MessoRequest,
    MessoResponse,
    MessoServer,
    MessoPeer,
    MessoMessage,
    MessoAck
} from './';
import { MessoEvent } from './lib';

const server = new http.Server()

server.listen(3030, () => {
    console.log("listening on port 3030")
});

const ms: MessoServer = new MessoServer({
    server: server
});
ms.use(async (query: ParsedUrlQuery, headers: http.IncomingHttpHeaders, cookies: any) => {
    return {
        qualcosa: 'a'
    };
});

ms.on('connection', async (messo: MessoPeer) => {

    messo.onMessage("message", (message: MessoMessage) => {
        console.log('message', message.body())
    });

    messo.on<MessoRequest>('request', 'request', (request: MessoRequest) => {
        console.log('request', request.body());
        request.respond({ type: "response", from: "server" });
    });

    messo.request("request", { type: "request", from: "server" }).then((response: MessoResponse) => {
        console.log('response', response.body());
    });

    messo.send("message", { type: "message", from: "server" }).then(() => {
        console.log('sent to client');
    });

    messo.on<MessoEvent>('event', 'close', () => {
        console.log('close');
    });

});