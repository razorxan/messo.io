import { v4 as uuidv4 } from 'uuid';

type MessoEventHandler = (...data: any) => any;

interface MessoListener {
    type: string;
    event: string;
    handler: MessoEventHandler;
}


class MessoEventEmitter {

    private _listeners: Map<string, MessoListener[]>

    constructor() {
        this._listeners = new Map();
    }

    public on(event: string, handler: MessoEventHandler): this {
        const listener = {
            id: uuidv4(),
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

    public off(event?: string, handler?: MessoEventHandler): this {
        if (!event) {
            this._listeners.forEach((_: MessoListener[], event: string,) => {
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

    emit(event: string, payload: any) {

    }

}