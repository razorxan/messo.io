import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';
import MessoChannel from './MessoChannel';
import MessoAck from './interfaces/IMessoAck.interface';
import MessoMeta from './interfaces/IMessoMeta.interface';
import MessoRequest from './MessoRequest';
import MessoEventEmitter from './MessoEventEmitter';


//TODO: refactor this with MessoSocket and fix private members, getters and setters
//TODO: impelement aks for type message
class MessoPeer extends MessoEventEmitter {

    _id: string;
    _socket: ws;
    _channel: MessoChannel;
    _responses: Map<string, MessoAck>;
    _meta: MessoMeta;

    constructor(channel: MessoChannel, socket: ws, meta: MessoMeta = {}) {
        super();
        this._channel = channel;
        this._socket = socket;
        this._responses = new Map<string, MessoAck>();
        this._id = uuidv4();
        this._meta = meta;
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
        this.socket.on('message', (e: ws.Data) => {
            try {
                if (typeof e !== 'string') return;
                const { type, id, event, data }: { type: string, id: string, event: string, data: any[] } = JSON.parse(e);
                switch (type) {
                    case 'request':
                        this.handleRequestEvent(event, id, data);
                        break;
                    case 'response':
                        this.handlResponseEvent(id, data);
                        break;
                    case 'message':
                        this.emitMessage(event, data);
                        break;
                    case 'ack':
                        this.handleAckEvent(id, data);
                        break;

                }
            } catch (error) {
                throw new Error(error);
            }
        });
    }

    private handleRequestEvent(event: string, id: string, data: any[]) {
        this.emitRequest(event, new MessoRequest(id, event, data, this.socket));
    }

    private handlResponseEvent(id: string, data: any) {
        const response = this._responses.get(id);
        if (!response) throw new Error('Could not find an response object suitable for the request.');
        response.resolve(data);
        this._responses.delete(id);
    }

    private handleAckEvent(id: string, data: any) {
        const response = this._responses.get(id);
        if (!response) throw new Error('Could not find an response object suitable for the message.');
        response.resolve(data);
        this._responses.delete(id);
    }

    public join(roomId: string): this {
        this._channel.join(this._id, roomId);
        return this;
    }

    public leave(roomId: string): this {
        this._channel.leave(this._id, roomId);
        return this;
    }

    public request(event: string, body: any): Promise<MessoRequest> {
        let resolve = () => { }, reject = () => { };
        const id = uuidv4();
        const promise: Promise<MessoRequest> = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
            this._socket.send(JSON.stringify({
                type: 'request',
                id,
                event,
                data: body,
            }))
        })
        //FIXME: timeout should be handled in the server configuration
        this._responses.set(id, { resolve, reject });
        return promise;
    }

    public send(event: string, body: any): Promise<MessoAck> {
        let resolve = () => { }, reject = () => { };
        const id = uuidv4();
        const promise: Promise<MessoAck> = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
            this._socket.send(JSON.stringify({
                type: 'message',
                id,
                event,
                data: body,
            }));
        });
        this._responses.set(id, { resolve, reject });
        return promise;
    }

}

export default MessoPeer;