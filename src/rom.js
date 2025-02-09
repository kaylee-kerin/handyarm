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
    console.warn(`ROM read out of bounds: offset 0x${offset.toString(16)}`);
    return 0; // Or throw an error, depending on your design
   }

   if (offset % 4 !== 0) {
    console.warn(`ROM read from unaligned address: 0x${offset.toString(16)}`);
    return 0;
   }

   const wordIndex = offset / 4;
   return this.data[wordIndex];
  }

  write(offset, value) {
   console.warn("Attempted write to ROM at offset: 0x" + offset.toString(16));
   // ROM is read-only, so we do nothing.
  }
 }

 module.exports = ROM;