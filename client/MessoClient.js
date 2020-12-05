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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
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
    EventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var callbacks = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach(function (callback) {
                callback.apply(void 0, args);
            });
        }
        return this;
    };
    return EventEmitter;
}());
var MessoClient = /** @class */ (function (_super) {
    __extends(MessoClient, _super);
    function MessoClient(url) {
        if (url === void 0) { url = '/'; }
        var _this = _super.call(this) || this;
        _this.url = url;
        _this.ws = new WebSocket(_this.url);
        _this.responses = new Map();
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
                    _this.handlResponse(id, data);
                    break;
                case 'request':
                    _this.handleRequest(id, event, data);
                    break;
                case 'message':
                    _this.handleMessage(event, id, data);
                    break;
            }
        });
    };
    MessoClient.prototype.handleMessage = function (event, id, data) {
        this.ws.send(JSON.stringify({
            type: 'message',
            event: event,
            id: id,
            data: data
        }));
    };
    MessoClient.prototype.handleRequest = function (id, event, data) {
        var fn = function (payload) {
            this.ws.send(JSON.stringify({
                type: 'response',
                event: event,
                id: id,
                data: payload
            }));
        }.bind(this);
        this.emit.apply(this, __spreadArrays([event], data, [fn]));
    };
    MessoClient.prototype.handlResponse = function (id, data) {
        var response = this.responses.get(id);
        response.resolve(data);
        this.responses["delete"](id);
    };
    MessoClient.prototype.send = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var id = uuidv4();
        this.ws.send(JSON.stringify({
            type: 'message',
            id: id,
            event: event,
            data: args
        }));
    };
    MessoClient.prototype.request = function (event) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var id = uuidv4();
        var resolve, reject;
        var promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
            _this.ws.send(JSON.stringify({
                type: 'request',
                id: id,
                event: event,
                data: args
            }));
        });
        this.responses.set(id, {
            resolve: resolve,
            reject: reject
        });
        return promise;
    };
    return MessoClient;
}(EventEmitter));
