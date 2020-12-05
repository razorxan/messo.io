
import querystring from 'querystring';
import http from 'http';
import MessoPeer from '../MessoPeer';
import MessoMeta from '../interfaces/MessoMeta.interface';

export type MessoPeerComparison = (peer: MessoPeer) => boolean;

export interface MessoAuthenticationResult {
    meta: MessoMeta;
    peer: MessoPeerComparison
}

export type MessoAuthenticationMiddleware = (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, cookies: any) => Promise<MessoAuthenticationResult>;