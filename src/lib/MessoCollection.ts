import Messo from './Messo';

class MessoCollection {

    private _peers: Messo[];

    constructor(peers: Messo[] = []) {
        this._peers = peers;
    }

    get peers(): Messo[] {
        return this._peers;
    }

    set peers(peers: Messo[]) {
        this._peers = peers;
    }

    has(id: string | number): boolean {
        return this.some((peer: Messo) => peer.id === id.toString());
    }

    get(id: string | number): Messo | undefined {
        return this.find((peer: Messo) => peer.id === id.toString());
    }

    push(peer: Messo): this {
        if (!this.some((p: Messo) => p.id === peer.id)) {
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
        const index = this._peers.findIndex((peer: Messo) => peer.id === id.toString());
        if (index > -1) {
            this._peers.splice(index, 1);
        }
        return this;
    }

    delete = this.remove.bind(this);

    find(fn: (peer: Messo, index?: number) => boolean): Messo | undefined {
        return this._peers.find(fn);
    }

    findIndex(fn: (peer: Messo, index?: number) => boolean): number {
        return this._peers.findIndex(fn);
    }

    some(fn: (peer: Messo) => boolean): boolean {
        return this._peers.some(fn);
    }

    concat(...args: MessoCollection[]): this {
        args.forEach((collection: MessoCollection) => {
            this._peers.concat(collection.peers);
        })
        return this;
    }

    each(fn: (peer: Messo, index?: number) => void): this {
        this._peers.forEach(fn);
        return this;
    }

    map(fn: (peer: Messo, index?: number) => any): this {
        this._peers = this._peers.map(fn);
        return this;
    }

    filter(fn: (peer: Messo, index?: number) => boolean): this {
        this._peers = this._peers.filter(fn);
        return this;
    }

    sort(fn: (a: Messo, b: Messo) => number): this {
        this._peers.sort(fn);
        return this;
    }

    send(event: string, data: any): this {
        this.each((peer: Messo) => {
            peer.send(event, data);
        })
        return this;
    }

    request(event: string, data: any): Promise<any>[] {
        return this._peers.map((peer: Messo) => peer.request(event, data));
    }

    join(roomId: string): this {
        this._peers.forEach((peer: Messo) => {
            peer.join(roomId);
        });
        return this;
    }

    leave(roomId: string): this {
        this._peers.forEach((peer: Messo) => {
            peer.leave(roomId);
        });
        return this;
    }

    disconnect(): this {
        return this;
    }

}

export default MessoCollection;