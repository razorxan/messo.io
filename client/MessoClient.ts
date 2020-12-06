const uuidv4 = () => {
    let dt: number = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r: number = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
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


}


class MessoClient extends EventEmitter {
    private url: string;
    private ws: WebSocket;
    private responses: Map<any, any>;

    constructor(url: string = '/') {
        super();
        this.url = url;
        this.ws = new WebSocket(this.url);
        this.responses = new Map();
        this.initHandlers();
    }

    private initHandlers() {
        this.ws.addEventListener('open', () => {
            this.emit("connection");
        });
        this.ws.addEventListener("message", (e: MessageEvent) => {
            const { type, id, event, data }: { type: string, id: string, event: string, data: any } = JSON.parse(e.data);

            switch (type) {
                case 'response':
                    this.handlResponse(id, data);
                    break;
                case 'request':
                    this.handleRequest(id, event, data);
                    break;
                case 'message':
                    this.handleMessage(event, id, data);
                    break;
            }
        });
    }

    private handleMessage(event: string, id: string, data: any) {
        this.ws.send(JSON.stringify({
            type: 'ack',
            id,
            event,
            data: +new Date,
        }));
        this.emit.apply(this, [event, data]);
    }

    private handleRequest(id: string, event: string, data: any) {
        this.emit(event, new MessoRequest(id, event, data, this.ws));
    }

    private handlResponse(id: string, data: any) {
        const response = this.responses.get(id);
        response.resolve(data);
        this.responses.delete(id);
    }

    public send(event: string, body: any) {
        const id: string = uuidv4();
        this.ws.send(JSON.stringify({
            type: 'message',
            id,
            event,
            data: body,
        }));
    }

    request(event: string, body?: any) {
        const id: string = uuidv4();
        let resolve: any, reject: any;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
            this.ws.send(JSON.stringify({
                type: 'request',
                id,
                event,
                data: body
            }));
        });
        this.responses.set(id, {
            resolve,
            reject,
        });
        return promise;
    }

}