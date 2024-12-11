import MessoAck from "../shared/Ack";
import MessoMessage from "../shared/Message";
import MessoResponse from "../shared/Response";
import { RequestPromise, RequestOptions } from "../shared/interfaces";
import { EventEmitter, MessoClientOptions, MessoClientRequest, uuidv4 } from "./utils";


export class MessoClient extends EventEmitter {
    private url: string;
    private ws: WebSocket;
    private _promises: Map<any, any>;
    private readonly _requestTimeout: number;

    constructor(url: string = '/', options?: MessoClientOptions) {
        super();
        this.url = url;
        this.ws = new WebSocket(this.url);
        this._promises = new Map();
        this.initHandlers();
        this._requestTimeout = options?.requestTimeout || 0;
    }

    private initHandlers() {
        this.ws.addEventListener('open', () => {
            this.emit("connection");
        });
        this.ws.addEventListener("message", (e: MessageEvent) => {
            try {

                const { type, id, event, data, error }: { type: string, id: string, event: string, data: any, error?: any } = JSON.parse(e.data);
                switch (type) {
                    case 'response':
                        this.handlResponse(id, event, data, error);
                        break;
                    case 'request':
                        this.handleRequest(id, event, data);
                        break;
                    case 'message':
                        this.handleMessage(id, event, data);
                        break;
                    case 'ack':
                        this.handleAck(id, event, data);
                        break;
                }
            } catch (e) {
                console.log(`Cannot parse message because ${e}`)
            }
        });
    }

    private handleMessage(id: string, event: string, body: any) {
        this.ws.send(JSON.stringify({
            type: 'ack',
            id,
            event,
            data: +new Date,
        }));
        this.emit(event, new MessoMessage(id, event, body));
    }

    private handleAck(id: string, event: string, body: any, error?: Error) {
        const promise = this._promises.get(id);
        if (!promise) throw new Error('Could not find an response object suitable for the ack.');
        promise.resolve(new MessoAck(id, event, body));
        this._promises.delete(id);
    }

    private handleRequest(id: string, event: string, body: any) {
        this.emit(event, new MessoClientRequest(id, event, body, this.ws));
    }

    private handlResponse(id: string, event: string, body: any, error?: Error) {
        const promise = this._promises.get(id);
        if (error) promise.reject(error);
        else promise.resolve(new MessoResponse(id, event, body));
        this._promises.delete(id);
    }

    private createSendPromise<T>(type: string, event: string, data: any, options?: RequestOptions): Promise<T> {
        const promise: RequestPromise = {
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
        return this.createTimeoutPromiseRace<T>(result, options?.timeout || this._requestTimeout);
    }

    private createTimeoutPromiseRace<T>(promise: Promise<T>, timeout?: number): Promise<T> {
        if (!timeout) return promise;
        const timeoutPromise: Promise<T> = new Promise((_, rej) => {
            setTimeout(() => {
                rej(new Error(`Request Timeout: exceeded ${timeout} ms`));
            }, timeout);
        });
        return Promise.race([timeoutPromise, promise]);
    }

    private sendObject(data: any) {
        this.ws.send(JSON.stringify(data));
    }

    public request(event: string, body?: any, options?: RequestOptions): Promise<MessoResponse> {
        return this.createSendPromise<MessoResponse>('request', event, body, options);
    }

    public send(event: string, body?: any): Promise<MessoAck> {
        return this.createSendPromise<MessoAck>('message', event, body);
    }

    public disconnect() {
        this.ws.close();
    }

}
