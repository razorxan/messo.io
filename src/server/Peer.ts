import { randomUUID } from 'crypto';
import PeerEventEmitter from './PeerEventEmitter';
import Request from './Request'
import Channel from './Channel';
import Socket from './Socket';
import Response from '../shared/Response';
import Ack from '../shared/Ack';
import Meta from './interfaces/Meta';
import Message from '../shared/Message';
import RequestPromise from '../shared/interfaces/RequestPromise';
import RequestOptions from '../shared/interfaces/RequestOptions';

class MessoPeer extends PeerEventEmitter {

    private _id: string;
    private _promises: Map<string, RequestPromise>;

    constructor(private _channel: Channel, private _socket: Socket, private _meta: Meta = {}) {
        super();
        this._promises = new Map<string, RequestPromise>();
        this._id = randomUUID();
        this.initSocketHandler();
    }

    public get(key: string) {
        return this._meta[key] ?? undefined;
    }

    public get id(): string {
        return this._id;
    }

    public get socket(): Socket {
        return this._socket;
    }

    initSocketHandler(): void {
        this._socket.on('close', () => {
            this.emit('event', 'close', null);
        });
        this._socket.on('request', this.handleRequestEvent.bind(this));
        this._socket.on('response', this.handleResponseEvent.bind(this));
        this._socket.on('message', this.handleMessageEvent.bind(this));
        this._socket.on('ack', this.handleAckEvent.bind(this));
    }

    private handleRequestEvent(id: string, event: string, data: any) {
        this.emit('request', event, new Request(id, event, data, this._socket));
    }

    private handleMessageEvent(id: string, event: string, data: any) {
        this._socket.send({
            type: 'ack',
            id,
            event,
            data: +new Date
        });
        this.emit('message', event, new Message(id, event, data));
    }

    private handleResponseEvent(id: string, event: string, data: any, error?: any) {
        const promise = this._promises.get(id);
        if (!promise) throw new Error('Could not find an response object suitable for the request.');
        if (error) promise.reject(error);
        else promise.resolve(new Response(id, event, data));
        this._promises.delete(id);
    }

    private handleAckEvent(id: string, event: string, data: any) {
        const promise = this._promises.get(id);
        if (!promise) throw new Error('Could not find an response object suitable for the ack.');
        promise.resolve(new Ack(id, event, data));
        this._promises.delete(id);
    }

    private createSendPromise<T>(type: string, event: string, data: any, options?: RequestOptions): Promise<T> {
        const promise: RequestPromise = {
            reject: () => { },
            resolve: () => { },
        };
        const id = randomUUID();
        const result: Promise<T> = new Promise((res, rej) => {
            promise.resolve = res;
            promise.reject = rej;
            this._socket.send({
                type,
                id,
                event,
                data,
            });
        });
        this._promises.set(id, promise);
        return this.createTimeoutPromiseRace<T>(result, options?.timeout || this._channel._requestTimeout);
    }

    private createTimeoutPromiseRace<T>(promise: Promise<T>, timeout: number | undefined): Promise<T> {
        if (!timeout) return promise;
        const timeoutPromise: Promise<T> = new Promise((_, rej) => {
            setTimeout(() => {
                rej(new Error(`Request Timeout: exceeded ${timeout} ms`));
            }, timeout);
        });
        return Promise.race([timeoutPromise, promise]);
    }

    public join(roomId: string): this {
        this._channel.join(this._id, roomId);
        return this;
    }

    public leave(roomId: string): this {
        this._channel.leave(this._id, roomId);
        return this;
    }

    public request(event: string, body?: any, options?: RequestOptions): Promise<Response> {
        return this.createSendPromise<Response>('request', event, body, options);
    }

    public send(event: string): Promise<Ack>;
    public send(event: string, body: any): Promise<Ack>;
    public send(event: string, body: any, callback: (ack: Ack) => any): void;
    public send(event: string, callback: (ack: Ack) => any): void;
    public send(event: string, body?: any, callback?: (ack: Ack) => any): Promise<Ack> | void {
        if (typeof body === 'function') {
            const promise = this.createSendPromise<Ack>('message', event, null);
            promise.then((ack: Ack) => body(ack));
            return
        } else {
            const promise = this.createSendPromise<Ack>('message', event, body);
            if (typeof callback === 'function') {
                promise.then((ack: Ack) => {
                    callback(ack);
                });
                return;
            }
            return promise;
        }
    }

}

export default MessoPeer;