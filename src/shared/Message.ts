import RequestBody from './interfaces/RequestBody';

class Message {

    protected _id: string;
    protected _event: string;
    protected _body: any;

    constructor(id: string, event: string, body: RequestBody) {
        this._id = id;
        this._event = event;
        this._body = body;
    }

    public body(key?: string) {
        if (key) {
            return this._body[key];
        }
        return this._body;
    }

    get id(): string {
        return this._id;
    }

    get event(): string {
        return this._event;
    }

}

export default Message;