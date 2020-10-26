import http from 'http';
import { ParsedUrlQuery } from 'querystring';

import MessoServer from './lib/MessoServer';

const server = new http.Server()

server.listen(3030, () => {
    console.log("listening on port 3030")
});

const ms: MessoServer = new MessoServer({
    server: server
});

ms.use(async (query: ParsedUrlQuery, headers: http.IncomingHttpHeaders, request: http.IncomingMessage) => {
    return { id: 'a', ciao: 'ciao' };
})

ms.on('connection', async messo => {
    ms.request(messo.id, 'prova', 'ciaone', (error: any, response: any) => {
        console.log('response con callback', error, response);
    })
    messo.on('socket::add', async () => {
        ms.request(messo.id, 'prova', 'ciaone').then((response: any) => {
            console.log('response con promise', response);
        })
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
