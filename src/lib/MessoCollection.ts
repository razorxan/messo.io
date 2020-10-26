import MessoPeer from './MessoPeer';

class MessoCollection {

    private _peers: MessoPeer[];

    constructor(peers: MessoPeer[] = []) {
        this._peers = peers;
    }

    get peers(): MessoPeer[] {
        return this._peers;
    }

    set peers(peers: MessoPeer[]) {
        this._peers = peers;
    }

    has(id: string | number): boolean {
        return this.some((peer: MessoPeer) => peer.id === id.toString());
    }

    get(id: string | number): MessoPeer | undefined {
        return this.find((peer: MessoPeer) => peer.id === id.toString());
    }

    push(peer: MessoPeer): this {
        if (!this.some((p: MessoPeer) => p.id === peer.id)) {
            this._peers.push(peer);
        }
        return this;
    }

    pop(): this {
        if (this._peers.length > 0) {
            this._peers.pop();
        }
        return this;
    }

    remove(id: string | number): MessoCollection {
        const index = this._peers.findIndex((peer: MessoPeer) => peer.id === id.toString());
        if (index > -1) {
            this._peers.splice(index, 1);
        }
        return this;
    }

    delete = this.remove.bind(this);

    find(fn: (peer: MessoPeer, index?: number) => boolean): MessoPeer | undefined {
        return this._peers.find(fn);
    }

    findIndex(fn: (peer: MessoPeer, index?: number) => boolean): number {
        return this._peers.findIndex(fn);
    }

    some(fn: (peer: MessoPeer) => boolean): boolean {
        return this._peers.some(fn);
    }

    concat(...args: MessoCollection[]): this {
        args.forEach((collection: MessoCollection) => {
            this._peers.concat(collection.peers);
        })
        return this;
    }

    each(fn: (peer: MessoPeer, index?: number) => void): this {
        this._peers.forEach(fn);
        return this;
    }

    map(fn: (peer: MessoPeer, index?: number) => any): this {
        this._peers = this._peers.map(fn);
        return this;
    }

    filter(fn: (peer: MessoPeer, index?: number) => boolean): this {
        this._peers = this._peers.filter(fn);
        return this;
    }

    sort(fn: (a: MessoPeer, b: MessoPeer) => number): this {
        this._peers.sort(fn);
        return this;
    }

    send(event: string, data: any): this {
        this.each((peer: MessoPeer) => {
            peer.send(event, data);
        })
        return this;
    }

    request(event: string, data: any): Promise<any>[] {
        return this._peers.map((peer: MessoPeer) => peer.request(event, data));
    }

    join(roomId: string): this {
        this._peers.forEach((peer: MessoPeer) => {
            peer.join(roomId);
        });
        return this;
    }

    leave(roomId: string): this {
        this._peers.forEach((peer: MessoPeer) => {
            peer.leave(roomId);
        });
        return this;
    }

    disconnect(): this {
        return this;
    }

}

export default MessoCollection;