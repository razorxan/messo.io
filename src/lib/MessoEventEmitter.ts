
import {
    IMessoListener,
    EventHandler,
    HandlerParamType,
    ListenerType
} from '../';


class EventEmitter {

    private _listeners: Map<string, IMessoListener[]> = new Map();

    private createListener<T extends HandlerParamType>(type: ListenerType, event: string, handler: EventHandler<T>) {
        const listener: IMessoListener = {
            type,
            event,
            handler: handler as EventHandler<T>
        }
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.push(listener);
        return this;
    }

    protected emit(type: ListenerType, event: string, body: any) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners
                .filter((listener: IMessoListener) => listener.type === type)
                .forEach((listener: IMessoListener) => listener.handler(body))
        }
        return this;
    }

    public on<T extends HandlerParamType>(type: ListenerType, event: string, handler: EventHandler<T>): this {
        switch (type) {
            case "request":
                return this.onRequest<T>(event, handler);
            case "message":
                return this.onMessage<T>(event, handler);
            case "event":
                return this.onEvent<T>(event, handler);
        }
    }

    public onRequest<T extends HandlerParamType>(event: string, handler: EventHandler<T>): this {
        return this.createListener<T>('request', event, handler);
    }

    public onMessage<T extends HandlerParamType>(event: string, handler: EventHandler<T>): this {
        return this.createListener<T>('message', event, handler);
    }

    public onEvent<T extends HandlerParamType>(event: string, handler: EventHandler<T>): this {
        return this.createListener('event', event, handler);
    }

    // public off<T extends HandlerParamType>(event?: string, handler?: EventHandler<T>): this {
    //     if (!event) {
    //         this._listeners.forEach((_: IMessoListener[], event: string) => {
    //             this._listeners.delete(event);
    //         });
    //     } else if (handler) {
    //         const events: IMessoListener[] | undefined = this._listeners.get(event);
    //         if (events) {
    //             const i: number = events.findIndex((listener: IMessoListener) => listener.handler === handler);
    //             if (i > 0) events.splice(i, 1);
    //             if (events.length < 1) this._listeners.delete(event);
    //         }
    //     } else {
    //         this._listeners.delete(event);
    //     }
    //     return this;
    // }

}


export default EventEmitter;