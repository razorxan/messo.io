import http from 'http';
import { ParsedUrlQuery } from 'querystring';
import MessoPeer from './lib/MessoPeer';
import MessoRequest from './lib/MessoRequest';
import MessoServer from './lib/MessoServer';

const server = new http.Server()

server.listen(3030, () => {
    console.log("listening on port 3030")
});

const ms: MessoServer = new MessoServer({
    server: server
});
type BelongsToPeer = (peer: MessoPeer) => boolean;
ms.use(async (query: ParsedUrlQuery, headers: http.IncomingHttpHeaders, cookies: any) => {
    return {
        meta: { qualcosa: 'a' },
        peer: (peer: MessoPeer) => peer.get('qualcosa') === 'a'
    };
});

ms.on('connection', async (messo: MessoPeer) => {
    ms.request(messo.id, 'prova', 'ciaone', 'second').then((response: any) => {
        console.log('response after promise', response);
    }).catch(error => {
        console.log(error);
    });
    messo.on("ciccio", (a: any, b: any, c: any) => {
        console.log(a, b, c);
    });

    messo.on('request_test', (request: MessoRequest) => {
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
