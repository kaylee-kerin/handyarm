const { EventEmitter } = require('events');


class IO extends EventEmitter {
    constructor() {
        super();
        this._values = {};
    }

    setValue(address, value) {
        this._values[address] = value;
    }

    read(address) {
        return this._values[address];
    }

    write(address, value) {
         this.emit('data', {channel: address, value:value} ); // Emit a 'data' event
    }
}

module.exports = {IO};
