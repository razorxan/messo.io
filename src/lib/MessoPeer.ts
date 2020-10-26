import { EventEmitter } from 'events';
import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';
import MessoChannel from './MessoChannel';
import MessoAck from './interfaces/MessoAck.interface';
import MessoMeta from './interfaces/MessoMeta.interface';


//TODO: refactor this with MessoSocket and fix private members, getters and setters
//TODO: impelement aks for type message
class MessoPeer extends EventEmitter {

    _id: string;
    _sockets: Map<string, ws>;
    _channel: MessoChannel;
    _responses: Map<string, MessoAck>;
    _meta: MessoMeta;

    constructor(channel: MessoChannel, id: string, meta: MessoMeta = {}) {
        super();
        this._channel = channel;
        this._sockets = new Map<string, ws>();
        this._responses = new Map<string, MessoAck>();
        this._id = id;
        this._meta = meta;
    }

    get id(): string {
        return this._id;
    }

    addSocket(socket: ws): this {
        const id: string = uuidv4();
        this.initSocketHandler(socket, id);
        this._sockets.set(id, socket);
        this.emit('socket::add', socket);
        return this;
    }

    initSocketHandler(socket: ws, id: string): void {
        socket.on('close', () => {
            this.removeSocket(id);
        });
        socket.on('message', (e: ws.Data) => {
            try {
                if (typeof e !== 'string') return;
                const { type, id, event, data } = JSON.parse(e);
                switch (type) {
                    case 'request':
                        const fn = function (payload: any) {
                            socket.send(JSON.stringify({
                                type: 'response',
                                event,
                                id,
                                data: payload,
                            }));
                        }.bind(this);
                        this.emit(event, data, fn);
                        break;
                    case 'response':
                        const response = this._responses.get(id);
                        if (!response) throw new Error('Could not find an response object suitable for the request.');
                        response.resolve(data);
                        this._responses.delete(id);
                        break;
                    case 'message':
                        this.emit(event, data);
                        break;
                }
            } catch (error) {
                throw new Error(error);
            }
        });
    }

    removeSocket(id: string): string {
        if (!this._sockets.has(id)) throw new Error(`Could not find socket with id ${id}`);
        this._sockets.delete(id);
        this.emit('socket::remove', id);
        if (this._sockets.size < 1) {
            this.emit('socket:empty');
            this.emit('close');
        }
        return id;
    }

    removeAllSockets(): this {
        this._sockets.clear();
        this.emit('socket:empty');
        this.emit('close');
        return this;
    }

    getSocket(id: string): ws | undefined {
        return this._sockets.get(id);
    }

    getSockets(): ws[] {
        return [...this._sockets].map(([_, socket]: [string, ws]) => socket);
    }

    send(event: string, ...args: any): this {
        this._sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: 'message',
                event,
                args,
            }));
        });
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

    request(event: string, data: any): Promise<any>;
    request(event: string, data: any, callback: Function): this;
    request(event: string, data: any, callback?: Function): this | Promise<any> {
        const promises: Promise<any>[] = [];
        for (let [_, socket] of this._sockets) {
            let resolve = () => { }, reject = () => { };
            let id = uuidv4();
            promises.push(new Promise((res, rej) => {
                resolve = res;
                reject = rej;
                socket.send(JSON.stringify({
                    type: 'request',
                    id,
                    event,
                    data,
                }))
            }));
            if (callback) {
                promises.forEach((promise: Promise<any>) => {
                    promise.then(data => {
                        callback(null, data);
                    }).catch(error => {
                        callback(error, null);
                    })
                });
            }
            //FIXME: handle timeout cases when we have to reject the promise after some waiting
            this._responses.set(id, { resolve, reject })
        }
        return callback ? this : Promise.all(promises);
    }

}

export default MessoPeer;