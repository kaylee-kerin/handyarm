// ram.js
class RAM {
    constructor(sizeInBytes) {
        this.size = sizeInBytes;
        this.buffer = new ArrayBuffer(sizeInBytes);
        this.dataView = new DataView(this.buffer);
    }

    read(offset) {
        if (offset < 0 || offset >= this.size) {
            console.warn(`RAM read out of bounds: offset 0x${offset.toString(16)}`);
            return 0;
        }
        return this.dataView.getUint32(offset, true); // little-endian
    }

    write(offset, value) {
        if (offset < 0 || offset >= this.size) {
            console.warn(`RAM write out of bounds: offset 0x${offset.toString(16)}`);
            return;
        }
        this.dataView.setUint32(offset, value, true); // little-endian
    }
}

module.exports = RAM;