import ws from 'ws';

interface MessoRequestBody {
    [propName: string]: any;
}

class MessoRequest {

    private _id: string;
    private _event: string;
    private _body: any;
    private _socket: ws;

    constructor(id: string, event: string, body: MessoRequestBody, socket: ws) {
        this._id = id;
        this._event = event;
        this._body = body;
        this._socket = socket;
    }

    public body(key?: string) {
        if (key) {
            return this._body[key];
        }
        return this._body;
    }

    get event(): string {
        return this._event;
    }

    get id(): string {
        return this._id;
    }

    public respond(payload: any) {
        this._socket.send(JSON.stringify({
            type: "response",
            id: this._id,
            event: this._event,
            data: payload
        }));
    }


}

export default MessoRequest;