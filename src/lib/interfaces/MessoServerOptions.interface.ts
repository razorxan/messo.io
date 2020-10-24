import http from 'http';
import https from 'https';

export default interface MessoServerOption {
    server?: http.Server | https.Server;
    port?: number;
    requestTimeout?: number;
}