var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var uuidv4 = function () {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.callbacks = new Map;
    }
    EventEmitter.prototype.on = function (event, cb) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(cb.bind(this));
        return this;
    };
    EventEmitter.prototype.off = function (event, cb) {
        var _this = this;
        if (!event) {
            this.callbacks.forEach(function (_, event) {
                _this.callbacks["delete"](event);
            });
            return this;
        }
        var events = this.callbacks.get(event);
        if (cb) {
            var i = events.indexOf(cb);
            if (i > 0)
                events.splice(i, 1);
            if (events.length < 1)
                this.callbacks["delete"](event);
        }
        else {
            this.callbacks["delete"](event);
        }
        return this;
    };
    EventEmitter.prototype.emit = function (event, data) {
        var callbacks = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach(function (callback) {
                callback(data);
            });
        }
        return this;
    };
    return EventEmitter;
}());
var MessoMessage = /** @class */ (function () {
    function MessoMessage(id, event, body) {
        this._id = id;
        this._event = event;
        this._body = body;
    }
    MessoMessage.prototype.body = function (key) {
        if (key) {
            return this._body[key];
        }
        return this._body;
    };
    return MessoMessage;
}());
var MessoResponse = /** @class */ (function (_super) {
    __extends(MessoResponse, _super);
    function MessoResponse() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MessoResponse;
}(MessoMessage));
;
var MessoAck = /** @class */ (function (_super) {
    __extends(MessoAck, _super);
    function MessoAck() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MessoAck;
}(MessoMessage));
;
var MessoRequest = /** @class */ (function (_super) {
    __extends(MessoRequest, _super);
    function MessoRequest(id, event, body, socket) {
        var _this = _super.call(this, id, event, body) || this;
        _this._socket = socket;
        return _this;
    }
    MessoRequest.prototype.respond = function (payload) {
        this._socket.send(JSON.stringify({
            type: "response",
            id: this._id,
            event: this._event,
            data: payload
        }));
    };
    return MessoRequest;
}(MessoMessage));
var MessoClient = /** @class */ (function (_super) {
    __extends(MessoClient, _super);
    function MessoClient(url) {
        if (url === void 0) { url = '/'; }
        var _this = _super.call(this) || this;
        _this.url = url;
        _this.ws = new WebSocket(_this.url);
        _this._promises = new Map();
        _this.initHandlers();
        return _this;
    }
    MessoClient.prototype.initHandlers = function () {
        var _this = this;
        this.ws.addEventListener('open', function () {
            _this.emit("connection");
        });
        this.ws.addEventListener("message", function (e) {
            var _a = JSON.parse(e.data), type = _a.type, id = _a.id, event = _a.event, data = _a.data;
            switch (type) {
                case 'response':
                    _this.handlResponse(id, event, data);
                    break;
                case 'request':
                    _this.handleRequest(id, event, data);
                    break;
                case 'message':
                    _this.handleMessage(id, event, data);
                    break;
                case 'ack':
                    _this.handleAck(id, event, data);
                    break;
            }
        });
    };
    MessoClient.prototype.handleMessage = function (id, event, body) {
        this.ws.send(JSON.stringify({
            type: 'ack',
            id: id,
            event: event,
            data: +new Date
        }));
        this.emit(event, new MessoMessage(id, event, body));
    };
    MessoClient.prototype.handleAck = function (id, event, body) {
        var promise = this._promises.get(id);
        if (!promise)
            throw new Error('Could not find an response object suitable for the ack.');
        promise.resolve(new MessoAck(id, event, body));
        this._promises["delete"](id);
    };
    MessoClient.prototype.handleRequest = function (id, event, body) {
        this.emit(event, new MessoRequest(id, event, body, this.ws));
    };
    MessoClient.prototype.handlResponse = function (id, event, body) {
        var response = this._promises.get(id);
        response.resolve(new MessoResponse(id, event, body));
        this._promises["delete"](id);
    };
    MessoClient.prototype.createSendPromise = function (type, event, data) {
        var _this = this;
        var promise = {
            reject: function () { },
            resolve: function () { }
        };
        var id = uuidv4();
        var result = new Promise(function (res, rej) {
            promise.resolve = res;
            promise.reject = rej;
            _this.sendObject({
                type: type,
                id: id,
                event: event,
                data: data
            });
        });
        this._promises.set(id, promise);
        return result;
    };
    MessoClient.prototype.sendObject = function (data) {
        this.ws.send(JSON.stringify(data));
    };
    MessoClient.prototype.request = function (event, body) {
        return this.createSendPromise('request', event, body);
    };
    MessoClient.prototype.send = function (event, body) {
        return this.createSendPromise('message', event, body);
    };
    return MessoClient;
}(EventEmitter));
