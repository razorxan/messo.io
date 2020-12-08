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

const server = new http.Server()

server.listen(3030, () => {
    console.log("listening on port 3030")
});

const ms: MessoServer = new MessoServer({
    server: server
});
ms.use(async (query: ParsedUrlQuery, headers: http.IncomingHttpHeaders, cookies: any) => {
    return {
        meta: { qualcosa: 'a' },
        peer: (peer: MessoPeer) => peer.get('qualcosa') === 'a'
    };
});

ms.on('connection', async (messo: MessoPeer) => {

    messo.onMessage("message", (message: MessoMessage) => {
        console.log('message', message.body())
    });

    messo.onRequest('request', (request: MessoRequest) => {
        console.log('request', request.body());
        request.respond({ type: "response", from: "server" });
    });

    messo.request("request", { type: "request", from: "server" }).then((response: MessoResponse) => {
        console.log('response', response.body());
    });

    messo.send("message", { type: "message", from: "server" }).then(() => {
        console.log('sent to client');
    });

    // ms.request(messo.id, 'prova', 'ciaone').then((response: MessoResponse) => {
    //     console.log('response from client', response)
    // }).catch(error => {
    //     console.log(error);
    // });
    // ms.send(messo.id, 'test_messageru', 'ciao').then((ack: MessoAck) => {
    //     console.log('ack', ack)
    // });

    // console.log(messo.id, 'connected');
    // messo.on('socket::add', async () => {
    //     console.log('new socket')
    //     const result = await messo.request('prova', 'ciaone')
    //     console.log(result)
    // }).on('close', () => {
    //     console.log(messo.id, 'disconnected');
    // })
    // messo.on('request_test', (data: any, respond: Function) => {
    //     console.log('here. request_test_callback');
    //     respond('dont touch my tralalala');
    // });

    // messo.on('test_message', (data: any) => {
    //     console.log('test_message', data);
    // });






});
