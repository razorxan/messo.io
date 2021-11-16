const uuidv4 = () => {
    let dt: number = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r: number = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

interface IMessoPromise {
    resolve: (...args: any) => void,
    reject: (...args: any) => void,
}

type EventEmitterCallback = (body: any) => {};

class EventEmitter {

    private callbacks: Map<string, EventEmitterCallback[]>;

    constructor() {
        this.callbacks = new Map;
    }

    on(event: string, cb: EventEmitterCallback): this {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(cb.bind(this));
        return this;
    }

    off(event?: string, cb?: EventEmitterCallback): this {
        if (!event) {
            this.callbacks.forEach((_: EventEmitterCallback[], event: string,) => {
                this.callbacks.delete(event);
            });
            return this;
        }
        const events: EventEmitterCallback[] = this.callbacks.get(event);
        if (cb) {
            const i: number = events.indexOf(cb);
            if (i > 0) events.splice(i, 1);
            if (events.length < 1) this.callbacks.delete(event);
        } else {
            this.callbacks.delete(event);
        }
        return this;
    }

    emit(event: string, data?: any): this {
        const callbacks: EventEmitterCallback[] = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach((callback: EventEmitterCallback) => {
                callback(data);
            });
        }
        return this;
    }
}

interface MessoBody {
    [propName: string]: any;
}

interface MessoRequestOption {
    timeout?: number;
}
class MessoMessage {

    protected _id: string;
    protected _event: string;
    protected _body: any;


    constructor(id: string, event: string, body: MessoBody) {
        this._id = id;
        this._event = event;
        this._body = body;
    }

    public body(key?: string) {
        if (key) {
            return this._body[key];
        }
        return this._body;
    }

}

class MessoResponse extends MessoMessage { };

class MessoAck extends MessoMessage { };

class MessoRequest extends MessoMessage {

    private _socket: WebSocket;

    constructor(id: string, event: string, body: MessoBody, socket: WebSocket) {
        super(id, event, body);
        this._socket = socket;
    }

    public respond(payload: any) {
        this._socket.send(JSON.stringify({
            type: "response",
            id: this._id,
            event: this._event,
            data: payload
        }));
    }

    public reject(error: any) {
        this._socket.send(JSON.stringify({
            type: "response",
            id: this._id,
            event: this._event,
            data: null,
            error,
        }));
    }

}

interface MessoClientOptions {
    requestTimeout?: number;
}

class MessoClient extends EventEmitter {
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
        this._requestTimeout = options?.requestTimeout;
    }

    private initHandlers() {
        this.ws.addEventListener('open', () => {
            this.emit("connection");
        });
        this.ws.addEventListener("message", (e: MessageEvent) => {
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
        this.emit(event, new MessoRequest(id, event, body, this.ws));
    }

    private handlResponse(id: string, event: string, body: any, error?: Error) {
        const promise = this._promises.get(id);
        if (error) promise.reject(error);
        else promise.resolve(new MessoResponse(id, event, body));
        this._promises.delete(id);
    }

    private createSendPromise<T>(type: string, event: string, data: any, options?: MessoRequestOption): Promise<T> {
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

    public request(event: string, body?: any, options?: MessoRequestOption): Promise<MessoResponse> {
        return this.createSendPromise<MessoResponse>('request', event, body, options);
    }

    public send(event: string, body?: any): Promise<MessoAck> {
        return this.createSendPromise<MessoAck>('message', event, body);
    }

}
