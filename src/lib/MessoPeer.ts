import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
    Request,
    Response,
    Ack,
    Channel,
    EventEmitter,
    Message,
    IMessoMeta,
    IMessoPromise,
    IMessoRequestOptions,
} from '.';

//TODO: refactor this with MessoSocket and fix private members, getters and setters
//TODO: impelement aks for type message
class MessoPeer extends EventEmitter {

    private _id: string;
    private _promises: Map<string, IMessoPromise>;

    constructor(private _channel: Channel, private _socket: ws, private _meta: IMessoMeta = {}) {
        super();
        this._promises = new Map<string, IMessoPromise>();
        this._id = uuidv4();
        this.initSocketHandler();

    }

    public get(key: string) {
        return this._meta[key] ?? undefined;
    }

    public get id(): string {
        return this._id;
    }

    public get socket(): ws {
        return this._socket;
    }

    initSocketHandler(): void {
        this._socket.on('close', () => {
            this.emit('event', 'close', null);
        });
        this._socket.on('message', (e: ws.Data, binary: boolean) => {
            if (binary) return;
            const message = e.toString();
            try {
                const { type, id, event, data }: { type: string, id: string, event: string, data: any } = JSON.parse(message);
                switch (type) {
                    case 'request':
                        this.handleRequestEvent(id, event, data);
                        break;
                    case 'response':
                        this.handlResponseEvent(id, event, data);
                        break;
                    case 'message':
                        this.handleMessageEvent(id, event, data);
                        break;
                    case 'ack':
                        this.handleAckEvent(id, event, data);
                        break;
                }
            } catch (error) {
                throw new Error(error);
            }
        });
    }

    private handleRequestEvent(id: string, event: string, data: any) {
        this.emit('request', event, new Request(id, event, data, this._socket));
    }

    private handleMessageEvent(id: string, event: string, data: any) {
        this.sendObject({
            type: 'ack',
            id,
            event,
            data: +new Date
        });
        this.emit('message', event, new Message(id, event, data));
    }

    private handlResponseEvent(id: string, event: string, data: any) {
        const promise = this._promises.get(id);
        if (!promise) throw new Error('Could not find an response object suitable for the request.');
        promise.resolve(new Response(id, event, data));
        this._promises.delete(id);
    }

    private handleAckEvent(id: string, event: string, data: any) {
        const promise = this._promises.get(id);
        if (!promise) throw new Error('Could not find an response object suitable for the ack.');
        promise.resolve(new Ack(id, event, data));
        this._promises.delete(id);
    }

    private createSendPromise<T>(type: string, event: string, data: any, options?: IMessoRequestOptions): Promise<T> {
        const promise: IMessoPromise = {
            reject: () => { },
            resolve: () => { },
        };
        const id = uuidv4();
        const result: Promise<T> = new Promise((res, rej) => {
            promise.resolve = res;
            promise.reject = rej;
            this.sendObject({
                type,
                id,
                event,
                data,
            });
        });
        this._promises.set(id, promise);
        return this.createTimeoutPromiseRace<T>(result, options?.timeout || 5000);
    }

    private createTimeoutPromiseRace<T>(promise: Promise<T>, timeout: number): Promise<T> {
        const timeoutPromise: Promise<T> = new Promise((_, rej) => {
            setTimeout(() => {
                rej(new Error(`Request Timeout: exceeded ${timeout} ms`));
            }, timeout);
        });
        return Promise.race([timeoutPromise, promise]);
    }

    private sendObject(data: any) {
        this._socket.send(JSON.stringify(data));
    }

    public join(roomId: string): this {
        this._channel.join(this._id, roomId);
        return this;
    }

    public leave(roomId: string): this {
        this._channel.leave(this._id, roomId);
        return this;
    }

    public request(event: string, body: any, options?: IMessoRequestOptions): Promise<Response> {
        return this.createSendPromise<Response>('request', event, body, options);
    }

    public send(event: string, body: any): Promise<Ack>;
    public send(event: string, body: any, callback: (ack: Ack) => any): void;
    public send(event: string, body: any, callback?: (ack: Ack) => any): Promise<Ack> | void {
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

export default MessoPeer;