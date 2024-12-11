import { Server as HttpServer } from 'http';
import { Server as HttpsServer} from 'https';

export default interface ServerOptions {
    server?: HttpServer | HttpsServer;
    port?: number;
    requestTimeout?: number;
}