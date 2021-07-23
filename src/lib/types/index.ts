import http from 'http';
import querystring from 'querystring';
import { MessoMessage, MessoRequest, IMessoMeta } from '../';

export type MessoAuthenticationMiddleware = (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, cookies: any) => Promise<IMessoMeta>;
export type MessoEvent = string;


export type MessoListenerType = 'request' | 'message' | 'event';
export type MessoHandlerParamType = MessoRequest | MessoMessage | MessoEvent;
export type MessoEventHandler<T> = (body: T) => any;