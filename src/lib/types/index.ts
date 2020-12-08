import http from 'http';
import querystring from 'querystring';
import { MessoPeer, IMessoAuthenticationResult } from '../';

export type MessoPeerComparison = (peer: MessoPeer) => boolean;
export type MessoAuthenticationMiddleware = (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, cookies: any) => Promise<IMessoAuthenticationResult>;
export type MessoEventHandler = (...data: any) => any;