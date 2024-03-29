import http from 'http';
import { ParsedUrlQuery } from 'querystring';
import {
    Request,
    Response,
    Server,
    Peer,
    Message,
    Ack
} from './';
import { Event } from './lib';

const server = new http.Server()

server.listen(8080, () => {
    console.log("listening on port 8080")
});

const ms: Server = new Server({
    server,
    requestTimeout: 300,
});



ms.use(async (query: ParsedUrlQuery, headers: http.IncomingHttpHeaders, cookies: any) => {
    return {
        qualcosa: 'a'
    };
});

ms.on('connection', async (messo: Peer) => {

    messo.on<Message>("message", "message", (message: Message) => {
        console.log('message', message.body())
    });

    messo.on<Request>('request', 'request', (request: Request) => {

        console.log('request', request.body());
        request.respond({ type: "response", from: "server" });
    });

    messo.request("request", { type: "request", from: "server" }).then((response: Response) => {
        console.log('response', response.body());
    }).catch(error => {
        console.log(error);
    });

    messo.send("message", { type: "message", from: "server" }).then(() => {
        console.log('sent to client');
    });

    messo.send("message", { type: "message", from: "server", with: "callback" }, (ack: Ack) => {
        console.log({ ack });
    })

    messo.on<Event>('event', 'close', () => {
        console.log('close');
    });

    messo.request('request').then((response: Response) => {
        console.log(response.body())
    })

    messo.request('routercapabilities', null, { timeout: 5000 }).then((response: Response) => {
        console.log(response.body());
    }).catch((error: Error) => {
        console.log({ error });
    })

});