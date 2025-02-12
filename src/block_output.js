const { EventEmitter } = require('events');

class Block_Output extends EventEmitter {
    constructor(bus) {
        super();
        this._bus = bus;
        this._values = {};
        this._startAddress = 0;
        this._length = 0;
    }

    setValue(address, value) {
        this._values[address] = value;
    }

    read(address) {
        return this._values[address];
    }

    write(address, value) {
        switch (address){
            case 0x00: //Start Address of the sequence to output
                this._startAddress = value;
                break;
            case 0x04: //Length of the sequence to output
                //When this write is performed, the transfer is performed immediately.
                //let's read the data we want to "send" and get it put in a block we can emit.
                const byteLength = value;
                const buffer = new Uint8Array(byteLength);

                // Calculate how many full 32-bit words we need to read
                const wordCount = Math.ceil(byteLength / 4);

                for (let i = 0; i < wordCount; i++) {
                    const currentAddress = this._startAddress + (i * 4);
                    const word = this._bus.read(currentAddress);

                    // Split 32-bit word into bytes and put into buffer
                    for (let j = 0; j < 4 && (i * 4 + j) < byteLength; j++) {
                        buffer[i * 4 + j] = (word >> (j * 8)) & 0xFF;
                    }
                }

                this.emit('data', buffer ); // Emit a 'data' event
                break;
            default:
                throw new Error(`Address out of range for Block_IO: {address}`);
        }

    }

}

module.exports = {Block_Output};
