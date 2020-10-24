import http from 'http';
import https from 'https';
import querystring from 'querystring';

import MessoPeerAuth from './MessoPeerAuth.interface';

export default interface MessoServerOptions {
    host?: string;
    port?: number;
    server: http.Server | https.Server
};