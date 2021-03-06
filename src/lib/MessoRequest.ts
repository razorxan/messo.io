import ws from 'ws';
import { MessoMessage, IMessoBody } from './';

class MessoRequest extends MessoMessage {

    private _socket: ws;

    constructor(id: string, event: string, body: IMessoBody, socket: ws) {
        super(id, event, body);
        this._socket = socket;
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