import { Message, IMessoBody, Socket } from './';

class MessoRequest extends Message {

    private _socket: Socket;

    constructor(id: string, event: string, body: IMessoBody, socket: Socket) {
        super(id, event, body);
        this._socket = socket;
    }

    public respond(payload: any) {
        this._socket.send({
            type: "response",
            id: this._id,
            event: this._event,
            data: payload
        });
    }

    public reject(error?: any) {
        this._socket.send({
            type: "response",
            id: this._id,
            event: this._event,
            data: null,
            error,
        })
    }


}

export default MessoRequest;