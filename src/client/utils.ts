export const uuidv4 = () => {
    let dt: number = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r: number = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

export interface IMessoPromise {
    resolve: (...args: any) => void,
    reject: (...args: any) => void,
}

export type EventEmitterCallback = (body: any) => {};

export class EventEmitter {

    private callbacks: Map<string, EventEmitterCallback[]>;

    constructor() {
        this.callbacks = new Map;
    }

    on(event: string, cb: EventEmitterCallback): this {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event)?.push(cb.bind(this));
        return this;
    }

    off(event?: string, cb?: EventEmitterCallback): this {
        if (!event) {
            this.callbacks.forEach((_: EventEmitterCallback[], event: string,) => {
                this.callbacks.delete(event);
            });
            return this;
        }
        const events: EventEmitterCallback[] | undefined = this.callbacks.get(event);
        if (cb && events?.length) {
            const i: number = events.indexOf(cb);
            if (i > 0) events.splice(i, 1);
            if (events.length < 1) this.callbacks.delete(event);
        } else {
            this.callbacks.delete(event);
        }
        return this;
    }

    emit(event: string, data?: any): this {
        const callbacks: EventEmitterCallback[] | undefined = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach((callback: EventEmitterCallback) => {
                callback(data);
            });
        }
        return this;
    }
}

export interface MessoBody {
    [propName: string]: any;
}

export interface MessoRequestOption {
    timeout?: number;
}
export class MessoMessage {

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

export class MessoResponse extends MessoMessage { };

export class MessoAck extends MessoMessage { };

export class MessoClientRequest extends MessoMessage {

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

export interface MessoClientOptions {
    requestTimeout?: number;
}