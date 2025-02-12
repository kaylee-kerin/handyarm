 // rom.js (modified)
 class ROM {
  constructor(data) {
   this.data = new Uint32Array(data); // Store as 32-bit words
   this.size = this.data.length * 4; // Size in bytes
  }

  read(offset) {
   if (this.size === 0) {
    return undefined;  // Special case for empty ROM
   }
   if (offset < 0 || offset >= this.size) {
    throw new Error(`ROM read out of bounds: offset 0x${offset.toString(16)}`);
   }

   if (offset % 4 !== 0) {
    throw new Error(`ROM read from unaligned address: 0x${offset.toString(16)}`);
   }

   const wordIndex = offset / 4;
   return this.data[wordIndex];
  }

  write(offset, value) {
   throw new Error(`Attempted write to ROM at offset: 0x${offset.toString(16)}`);
   // ROM is read-only, so we do nothing.
  }
 }

 module.exports = ROM;
