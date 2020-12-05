import { EventEmitter } from 'events';
import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';
import MessoChannel from './MessoChannel';
import MessoAck from './interfaces/MessoAck.interface';
import MessoMeta from './interfaces/MessoMeta.interface';
import MessoRequest from './MessoRequest';


//TODO: refactor this with MessoSocket and fix private members, getters and setters
//TODO: impelement aks for type message
class MessoPeer extends EventEmitter {

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

    get(key: string) {
        return this._meta[key] ?? undefined;
    }

    get id(): string {
        return this._id;
    }

    get socket(): ws {
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
                        this.emit(event, ...data);
                        break;
                }
            } catch (error) {
                throw new Error(error);
            }
        });
    }

    private handleRequestEvent(event: string, id: string, data: any[]) {
        this.emit(event, new MessoRequest(id, event, data, this.socket));
    }

    private handlResponseEvent(id: string, data: any) {
        const response = this._responses.get(id);
        if (!response) throw new Error('Could not find an response object suitable for the request.');
        response.resolve(data);
        this._responses.delete(id);
    }


    send(event: string, ...args: any): this {
        this._socket.send(JSON.stringify({
            type: 'message',
            event,
            args,
        }));
        return this;
    }

    join(roomId: string): this {
        this._channel.join(this._id, roomId);
        return this;
    }

    leave(roomId: string): this {
        this._channel.leave(this._id, roomId);
        return this;
    }

    request(event: string, ...data: any[]): Promise<any> {
        let resolve = () => { }, reject = () => { };
        let id = uuidv4();
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
            this._socket.send(JSON.stringify({
                type: 'request',
                id,
                event,
                data,
            }))
        })
        //FIXME: timeout should be handled in the server configuration
        this._responses.set(id, { resolve, reject })
        return promise;
    }

}

export default MessoPeer;