import { EventEmitter } from 'events';
import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';

class Messo extends EventEmitter {

    id: string;
    sockets: Map<string, ws>;

    constructor() {
        super();
        this.sockets = new Map<string, ws>();
    }

    addSocket(socket: ws) {
        const id: string = uuidv4();
        this.sockets.set(id, socket);
        this.emit('socket::add', socket)
        return this;
    }

    removeSocket(id: string) {
        if (!this.sockets.has(id)) throw new Error(`Could not find socket with id ${id}`);
        this.sockets.delete(id);
        return this;
    }

    getSocket(id: string) {
        return this.sockets.get(id);
    }

    getSockets() {
        return this.sockets;
    }

}

export default Messo;