import { EventEmitter } from 'events';
import ws from 'ws';

class MessoSocket extends EventEmitter {

    private _socket: ws;
    private _meta: any;

    constructor(socket: ws, meta: any = {}) {
        super();
        this._socket = socket;
        this._meta = meta;
        this.initHandlers();
    }

    private initHandlers() {
        this._socket.on('close', () => {
            this.emit('event', 'close', null);
        });
        this._socket.on('message', (e: ws.Data, binary: boolean) => {
            if (binary) return;
            const message = e.toString();
            try {
                const { type, id, event, data, error }: { type: string, id: string, event: string, data: any, error?: any } = JSON.parse(message);
                this.emit(type, id, event, data, error);
            } catch (error) {
                throw new Error(error);
            }
        });
    }

    public send(data: any) {
        this._socket.send(JSON.stringify(data));
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