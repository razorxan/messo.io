import MessoRequest from './MessoRequest';
import { MessoEventHandler } from './types'


interface MessoListener {
    type: 'request' | 'message';
    event: string;
    handler: MessoEventHandler;
}


interface MessoMessage {
    [key: string]: any
}

class MessoEventEmitter {

    private _listeners: Map<string, MessoListener[]>;

    constructor() {
        this._listeners = new Map();
    }

    public onRequest(event: string, handler: MessoEventHandler): this {
        const listener: MessoListener = {
            type: 'request',
            event,
            handler
        };
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.push(listener);
        return this;
    }

    public onMessage(event: string, handler: MessoEventHandler): this {
        const listener: MessoListener = {
            type: 'message',
            event,
            handler
        }
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.push(listener);
        return this;
    }

    public on(event: string, handler: MessoEventHandler): this {
        return this.onMessage(event, handler);
    }

    public off(event?: string, handler?: MessoEventHandler): this {
        if (!event) {
            this._listeners.forEach((_: MessoListener[], event: string) => {
                this._listeners.delete(event);
            });
        } else if (handler) {
            const events: MessoListener[] | undefined = this._listeners.get(event);
            if (events) {
                const i: number = events.findIndex((listener: MessoListener) => listener.handler === handler);
                if (i > 0) events.splice(i, 1);
                if (events.length < 1) this._listeners.delete(event);
            }
        } else {
            this._listeners.delete(event);
        }
        return this;
    }

    public emitRequest(event: string, request: MessoRequest) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners
                .filter((listener: MessoListener) => listener.type === 'request')
                .forEach((listener: MessoListener) => listener.handler(request))
        }
    }

    public emitMessage(event: string, message: MessoMessage) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners
                .filter((listener: MessoListener) => listener.type === 'message')
                .forEach((listener: MessoListener) => listener.handler(message))
        }
    }

}

export default MessoEventEmitter;