import http from 'http';
import https from 'https';

export default interface IMessoServerOptions {
    server?: http.Server | https.Server;
    port?: number;
    requestTimeout?: number;
}