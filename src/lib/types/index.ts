
import querystring from 'querystring';
import http from 'http';
import MessoPeer from '../MessoPeer';
import IMessoAuthenticationResult from '../interfaces/IMessoAuthenticationResult.interface'

export type MessoPeerComparison = (peer: MessoPeer) => boolean;
export type MessoAuthenticationMiddleware = (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, cookies: any) => Promise<IMessoAuthenticationResult>;
export type MessoEventHandler = (...data: any) => any;