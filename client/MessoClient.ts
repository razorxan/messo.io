const uuidv4 = () => {
    let dt: number = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r: number = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

type EventEmitterCallback = (...args: any[]) => {};

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

    emit(event: string, ...args: any[]): this {
        const callbacks: EventEmitterCallback[] = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach((callback: EventEmitterCallback) => {
                callback(...args);
            });
        }
        return this;
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
            type: 'message',
            event,
            id,
            data
        }));
    }

    private handleRequest(id: string, event: string, data: any) {
        const fn = function (payload) {
            this.ws.send(JSON.stringify({
                type: 'response',
                event,
                id,
                data: payload,
            }));
        }.bind(this);
        this.emit.apply(this, [event, ...data, fn]);
    }

    private handlResponse(id: string, data: any) {
        const response = this.responses.get(id);
        response.resolve(data);
        this.responses.delete(id);
    }

    public send(event: string, ...args: any) {
        const id: string = uuidv4();
        this.ws.send(JSON.stringify({
            type: 'message',
            id,
            event,
            data: args,
        }));
    }

    request(event: string, ...args) {
        const id: string = uuidv4();
        let resolve: any, reject: any;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
            this.ws.send(JSON.stringify({
                type: 'request',
                id,
                event,
                data: args
            }));
        });
        this.responses.set(id, {
            resolve,
            reject,
        });
        return promise;
    }

}