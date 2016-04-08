"use strict"

// module representation
var EXPORT = module.exports;

const util = require('util');
const EventEmitter = require('events');

var mongoose = EXPORT.mongoose = require("mongoose");

// Set mongoose to use Promise lib from promise
mongoose.Promise = require("promise");

// Connection management object
function Connection(mongo_uri) {
    mongo_uri = mongo_uri || "localhost";
    function _connect(ev, mongo_uri) {
        var db = mongoose.createConnection(mongo_uri, {
            config: { autoIndex: false },
            server: { auto_reconnect: false },
        });
        var _this = this;
        db.once("error", function(err) {
            ev.emit("mongoose::err", err);
            setTimeout(_connect, ev.fail(), ev, mongo_uri);
        });
        db.once("connected", function() {
            ev.reset();
            ev.emit("mongoose::conn", db);
            db.once("disconnected", function(err) {
                setTimeout(_connect, ev.fail(), ev, mongo_uri);
            })
        });
    }
    this.backoff = 0;
    _connect(this, mongo_uri);
}
util.inherits(Connection, EventEmitter);

Connection.prototype.fail = function fail() {
    this.backoff++;
    return Math.min(Math.pow(2, this.backoff), 2 * 1000);
}

Connection.prototype.reset = function reset() {
    this.backoff = 0;
    return true;
}

EXPORT.Connection = Connection;
