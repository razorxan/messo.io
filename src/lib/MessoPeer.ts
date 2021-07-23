import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
    MessoRequest,
    MessoResponse,
    MessoAck,
    MessoChannel,
    MessoEventEmitter,
    MessoMessage,
    IMessoMeta,
    IMessoPromise
} from './';


//TODO: refactor this with MessoSocket and fix private members, getters and setters
//TODO: impelement aks for type message
class MessoPeer extends MessoEventEmitter {

    private _id: string;
    private _promises: Map<string, IMessoPromise>;

    constructor(private _channel: MessoChannel, private _socket: ws, private _meta: IMessoMeta = {}) {
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
        this._socket.on('message', (e: ws.Data) => {
            if (typeof e !== 'string') return;
            try {
                const { type, id, event, data }: { type: string, id: string, event: string, data: any } = JSON.parse(e);
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
        this.emit('request', event, new MessoRequest(id, event, data, this._socket));
    }

    private handleMessageEvent(id: string, event: string, data: any) {
        this.sendObject({
            type: 'ack',
            id,
            event,
            data: +new Date
        });
        this.emit('message', event, new MessoMessage(id, event, data));
    }

    private handlResponseEvent(id: string, event: string, data: any) {
        const promise = this._promises.get(id);
        if (!promise) throw new Error('Could not find an response object suitable for the request.');
        promise.resolve(new MessoResponse(id, event, data));
        this._promises.delete(id);
    }

    private handleAckEvent(id: string, event: string, data: any) {
        const promise = this._promises.get(id);
        if (!promise) throw new Error('Could not find an response object suitable for the ack.');
        promise.resolve(new MessoAck(id, event, data));
        this._promises.delete(id);
    }

    private createSendPromise<T>(type: string, event: string, data: any): Promise<T> {
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
        return result;
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

    public request(event: string, body: any): Promise<MessoResponse> {
        return this.createSendPromise<MessoResponse>('request', event, body);
    }

    public send(event: string, body: any): Promise<MessoAck> {
        return this.createSendPromise<MessoAck>('message', event, body);
    }

}

export default MessoPeer;