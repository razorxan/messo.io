import { EventEmitter } from 'events';
import MessoServer from './MessoServer';
import Messo from './Messo';

class MessoRoom extends EventEmitter {

    id: string;
    peerIds: string[];
    server: MessoServer;

    constructor(server: MessoServer, id: string) {
        super();
        this.server = server;
        this.peerIds = [];
        this.id = id;
    }

    addPeerId(peerId: string): MessoRoom {
        if (this.peerIds.includes(peerId)) {
            this.peerIds.push(peerId);
        }
        return this;
    }

    removePeerId(peerId: string): MessoRoom {
        if (this.peerIds.includes(peerId)) {
            this.peerIds.splice(this.peerIds.indexOf(peerId), 1);
        }
        return this;
    }

    send(event: string, ...args: any) {
        this.server.getPeers(this.peerIds).forEach((messo: Messo) => {
            messo.send(event, ...args);
        });
        return this;
    }

}

export default MessoRoom;