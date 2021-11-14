import http from 'http';
import querystring from 'querystring';
import { Message, IMessoMeta } from '../';

export type AuthenticationMiddleware = (query: querystring.ParsedUrlQuery, headers: http.IncomingHttpHeaders, cookies: any) => Promise<IMessoMeta>;
export type Event = string;


export type ListenerType = 'request' | 'message' | 'event';
export type HandlerParamType = Message | Message | Event;
export type EventHandler<T> = (body: T) => any;