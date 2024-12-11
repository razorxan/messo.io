
import Listener from './interfaces/Listener';
import { EventHandler, EventType, EventWithPrefix, ListenerType } from './types'


class PeerEventEmitter {

    private _listeners: Map<string, Listener[]> = new Map();

    private createListener<T extends EventType>(type: ListenerType, event: string, handler: EventHandler<T>): this {
        const listener: Listener = {
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
                .filter((listener: Listener) => listener.type === type)
                .forEach((listener: Listener) => listener.handler(body))
        }
        return this;
    }

    public on<T extends EventType>(
        event: EventWithPrefix<T>,
        handler: EventHandler<T>
    ): this {
        if (this.isRequestEvent(event)) {
            return this.onRequest<T>(event, handler);
        } else if (this.isMessageEvent(event)) {
            return this.onMessage<T>(event, handler);
        } else if (this.isEventEvent(event)) {
            return this.onEvent<T>(event, handler);
        } else {
            throw new Error('Invalid event name prefix');
        }
    }

    public onRequest<T extends EventType>(event: `request:${string}`, handler: EventHandler<T>): this {
        return this.createListener<T>('request', event, handler);
    }

    public onMessage<T extends EventType>(event: `message:${string}`, handler: EventHandler<T>): this {
        return this.createListener<T>('message', event, handler);
    }

    public onEvent<T extends EventType>(event: `event:${string}`, handler: EventHandler<T>): this {
        return this.createListener('event', event, handler);
    }

    private isRequestEvent(event: string): event is `request:${string}` {
        return event.startsWith('request:');
    }

    private isMessageEvent(event: string): event is `message:${string}` {
        return event.startsWith('message:');
    }

    private isEventEvent(event: string): event is `event:${string}` {
        return event.startsWith('event:');
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


export default PeerEventEmitter;