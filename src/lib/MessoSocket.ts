import ws from 'ws';

class MessoSocket {

    private _socket: ws;
    private _meta: any;

    constructor(socket: ws, meta: any = {}) {
        this._socket = socket;
        this._meta = meta;
    }

    public get(): any;
    public get(key: string): any;
    public get(key?: string): any {
        return key ? this._meta[key] : this._meta;
    }

    public set(key: string, value: any): void;
    public set(key: any): void;
    public set(key?: string, value?: any) {
        if (typeof key === 'string' && value !== undefined) {
            this._meta[key] = value;
        } else if (key !== undefined) {
            this._meta = key;
        }
    }

    get meta(): any {
        return this._meta;
    }

    set meta(data: any) {
        this._meta = data;
    }

    get socket(): ws {
        return this._socket;
    }

}

export default MessoSocket;