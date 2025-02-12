const { EventEmitter } = require('events');
const { RAM } = require('./ram.js');

/** We're going to implement a circular buffer, and a second of memory for the buffer inside this class.
 *
 *  A circular buffer has a start and end marker, and the data between them is the outstanding data to "read"
 */
class Block_Input extends EventEmitter {
    constructor(bus,size) {
        super();
        this._bus = bus;
        this._size = size;
        this._ram = new RAM(size);

        this._start = 0; //offsets in the buffer, not absolute addresses
        this._end = 0;
    }

    appendData(data){
        //copy the bytes from data into the circular buffer, data MUST be smaller than the buffer or an error occurs.
        //size your buffers appropriately.  It's not like RAM is constrained for this kinda use case!
        if (data.length > this._size) {
            throw new Error(`Data size (${data.length}) exceeds buffer size (${this._size})`);
        }

        let data_ptr = 0;

        while(data_ptr < data.length){
            let _end_remainder = this._end % 4; //How far are we into the current word?
            let _end_word = Math.floor(this._end/4)*4; //Aligned to word boundary

            let curword = this._ram.read(_end_word);

            curword = curword & ~(0xFF << (_end_remainder)*8); //mask out the byte we're going to write to.
            curword = curword | data[data_ptr] << ((_end_remainder)*8);
            this._ram.write(_end_word,curword); //and write it back

            this._end = (this._end + 1) % this._size;
            data_ptr++;
        }
    }

    read(address) {
        switch(address){
            case 0x00:
                return this._start;
            case 0x04:
                return this._end;
            case 0x08:
                return this._size
            default:
                if(address >= 0x100 && address < (0x100+this._size)){ //Map in the actual buffer
                    return this._ram.read(address-0x100);
                }else{
                    throw new Error(`Invalid read at address: ${address}`);
                }
        }
    }

    write(address, value) {
        switch (address){
            case 0x00: //writes to the start address are incremental, not absolutes.  The consumer of the buffer writes how many bytes to move the marker ahead.
                this._start = (this._start +value)%this._size;
                //TODO: Check that we've not moved past the end?
                break;
            case 0x04: //we can't modify end, just ignore it.
                break;
            default:
                throw new Error(`Address write out of range for Block_IO: {address}`);
        }

    }

}

module.exports = {Block_Input};
