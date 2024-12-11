import { EventEmitter } from 'events';
import Channel from './Channel';
import Collection from './Collection';
import Peer from './Peer';

class Room extends EventEmitter {

    private _id: string;
    private _peerIds: string[];
    private _channel: Channel;

    constructor(channel: Channel, id: string) {
        super();
        this._channel = channel;
        this._peerIds = [];
        this._id = id;
    }

    addPeerId(peerId: string): this {
        if (this._peerIds.includes(peerId)) {
            this._peerIds.push(peerId);
        }
        return this;
    }

    removePeerId(peerId: string): this {
        if (this._peerIds.includes(peerId)) {
            this._peerIds.splice(this._peerIds.indexOf(peerId), 1);
        }
        return this;
    }

    send(event: string, body: any): this {
        this.peers.each((peer: Peer) => {
            peer.send(event, body);
        });
        return this;
    }

    get peers(): Collection {
        return this._channel.peers.filter((peer: Peer): boolean => {
            return this._peerIds.includes(peer.id);
        });
    }

    get id(): string {
        return this._id;
    }

    get size(): number {
        return this._peerIds.length;
    }

    get empty(): boolean {
        return this.size === 0;
    }

}

export default Room;