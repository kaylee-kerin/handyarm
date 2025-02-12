 // rom.js (modified)
class ROM {
  constructor(data,options) {
   this.data = new Uint32Array(data); // Store as 32-bit words
   this.size = this.data.length * 4; // Size in bytes
   this.options = options||{bounds:true};
  }

  read(offset) {
   if (this.size === 0) {
       return undefined;  // Special case for empty ROM
   }
   if (offset < 0 || offset >= this.size) {
       if(this.options.bounds){ 
           throw new Error(`ROM read out of bounds: offset 0x${offset.toString(16)}`);
       }else{
           return 0xFFFFFFFF;
       }

   }

   if (offset % 4 !== 0) {
      throw new Error(`ROM read from unaligned address: 0x${offset.toString(16)}`);
   }

   const wordIndex = offset / 4;
   return this.data[wordIndex];
  }

  write(offset, value) {
     throw new Error(`Attempted write to ROM at offset: 0x${offset.toString(16)}`);
  }
}

module.exports = {ROM};
