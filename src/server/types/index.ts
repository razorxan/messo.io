import { IncomingHttpHeaders as httpIncomingHeaders } from 'http';
import { IncomingHttpHeaders as httpsIncomingHeaders } from 'http';
import querystring from 'querystring';
import Message from '../../shared/Message';
import Meta from '../interfaces/Meta';
import Request from '../Request';

export type AuthenticationMiddleware = (query: querystring.ParsedUrlQuery, headers: httpIncomingHeaders | httpsIncomingHeaders, cookies: any) => Promise<Meta>;
export type ListenerType = 'request' | 'message' | 'event';
export type Event = string;
export type PeerEventTypes = {
    request: Request
    message: Message;
    event: Event;
}
export type EventHandler<T> = (body: T) => any;
export type EventType = Request | Message | Event;
export type EventTypePrefixMap = {
    Request: `request:${string}`;
    Message: `message:${string}`;
    Event: `event:${string}`;
};
export type EventWithPrefix<T extends EventType> =
    T extends Request ? EventTypePrefixMap['Request'] :
    T extends Message ? EventTypePrefixMap['Message'] :
    T extends Event ? EventTypePrefixMap['Event'] :
    never;