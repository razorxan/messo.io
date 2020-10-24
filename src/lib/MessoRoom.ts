import { EventEmitter } from 'events';
import MessoChannel from './MessoChannel';
import Messo from './Messo';

class MessoRoom extends EventEmitter {

    private _id: string;
    private _peerIds: string[];
    private _channel: MessoChannel;

    constructor(server: MessoChannel, id: string) {
        super();
        this._channel = server;
        this._peerIds = [];
        this._id = id;
    }

    addPeerId(peerId: string): MessoRoom {
        if (this._peerIds.includes(peerId)) {
            this._peerIds.push(peerId);
        }
        return this;
    }

    removePeerId(peerId: string): MessoRoom {
        if (this._peerIds.includes(peerId)) {
            this._peerIds.splice(this._peerIds.indexOf(peerId), 1);
        }
        return this;
    }

    send(event: string, ...args: any) {
        this._channel.getPeers(this._peerIds).forEach((messo: Messo) => {
            messo.send(event, ...args);
        });
        return this;
    }

    get size(): Number {
        return this._peerIds.length;
    }

    get empty(): Boolean {
        return this.size === 0;
    }

}

export default MessoRoom;