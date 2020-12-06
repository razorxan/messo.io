import http from 'http';
import { ParsedUrlQuery } from 'querystring';
import { MessoRequest, MessoServer, MessoPeer, MessoMessage } from './';
import MessoAck from './lib/interfaces/IMessoAck.interface';

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
    ms.request(messo.id, 'prova', 'ciaone').then((response: MessoRequest) => {
        console.log('response from client', response)
    }).catch(error => {
        console.log(error);
    });
    ms.send(messo.id, 'test_messageru', 'ciao').then((ack: MessoAck) => {
        console.log('ack', ack)
    });
    messo.onMessage("ciccio", (payload: MessoMessage) => {
        console.log('ciccio event', payload)
    });

    messo.onMessage("test_message", (payload: MessoMessage) => {
        console.log('test_message event', payload);
    });

    messo.onRequest('request_test', (request: MessoRequest) => {
        console.log('request_test', request.body());
        request.respond('dio');
    });

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
