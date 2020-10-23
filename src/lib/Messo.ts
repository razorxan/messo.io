import { EventEmitter } from 'events';
import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';
import MessoServer from './MessoServer'
import MessoAck from './interfaces/MessoAck.interface'

class Messo extends EventEmitter {

    id: string;
    sockets: Map<string, ws>;
    server: MessoServer;
    responses: Map<string, MessoAck>;

    constructor(server: MessoServer, id: string) {
        super();
        this.server = server;
        this.sockets = new Map<string, ws>();
        this.responses = new Map<string, MessoAck>();
        this.id = id;
    }

    addSocket(socket: ws): this {
        const id: string = uuidv4();
        this.initSocketHandler(socket, id);
        this.sockets.set(id, socket);
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
                        const response = this.responses.get(id);
                        if (!response) throw new Error('Could not find an response object suitable for the request.');
                        response.resolve(data);
                        this.responses.delete(id);
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
        if (!this.sockets.has(id)) throw new Error(`Could not find socket with id ${id}`);
        this.sockets.delete(id);
        this.emit('socket::remove', id);
        if (this.sockets.size < 1) {
            this.emit('socket:empty');
            this.emit('close');
        }
        return id;
    }

    removeAllSockets(): Messo {
        this.sockets.clear();
        this.emit('socket:empty');
        this.emit('close');
        return this;
    }

    getSocket(id: string): ws | undefined {
        return this.sockets.get(id);
    }

    getSockets(): ws[] {
        return [...this.sockets].map(([_, socket]: [string, ws]) => socket);
    }

    send(event: string, ...args: any): Messo {
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: 'message',
                event,
                args,
            }));
        });
        return this;
    }

    join(roomId: string): Messo {
        this.server.join(this.id, roomId);
        return this;
    }

    request(event: string, data: any): Promise<any>;
    request(event: string, data: any, callback: Function): Messo;
    request(event: string, data: any, callback?: Function): Messo | Promise<any> {
        const promises: Promise<any>[] = [];
        for (let [_, socket] of this.sockets) {
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
            this.responses.set(id, { resolve, reject })
        }
        return callback ? this : Promise.all(promises);
    }

}

export default Messo;