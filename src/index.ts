import http from 'http';

import MessoServer from './lib/MessoServer';

const server = new http.Server()

server.listen(3030, () => {
    console.log("listening on port 3030")
});

const ms: MessoServer = new MessoServer({
    server: server,
    path: '/prova',
    authenticate: (query, headers, request) => {
        return new Promise((resolve, reject) => {
            resolve({ id: '1' });
        });
    }
});

ms.on('connection', async messo => {
    ms.request(messo.id, 'prova', 'ciaone', (error: any, response: any) => {
        console.log('response con callback', error, response);
    }).then((response: any) => {
        console.log('response con promise', response);
    })
    messo.on('socket::add', async () => {
        ms.request(messo.id, 'prova', 'ciaone', (error: any, response: any) => {
            console.log('response con callback', error, response);
        }).then((response: any) => {
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
