 // src/dma.js
 class DMA {
  constructor(bus) {
   this.bus = bus;
   this.sourceAddress = 0;
   this.destAddress = 0;
   this.transferLength = 0;

  /** This is the control register of our DMA controller.  It's a bitfield.
   * bit 0 - is the status register.  0 means it is not transferring, 1 means it is still transferring.
   * Bit 1 - source increment (0 means do not increment, 1 means increment)
   * Bit 2 - dest increment (0 means do not increment, 1 means increment)
   **/
   this.controlRegister = 0;

   this.dataSize = 4; // Default to 32-bit words
   this.transferComplete = false; // Internal flag
   this.interruptHandler = null; // Callback for interrupts
   this.bytesTransferred = 0;
  }

  // Register access methods
  read(offset) {
   switch (offset) {
    case 0x00:
     return this.sourceAddress;
    case 0x04:
     return this.destAddress;
    case 0x08:
     return this.transferLength;
    case 0x0C:
     return this.controlRegister;
    case 0x10:
     return this.dataSize;
    default:
     throw new Error(`DMA read from invalid offset: 0x${offset.toString(16)}`);
   }
  }

  write(offset, value) {
   switch (offset) {
    case 0x00:
     this.sourceAddress = value;
     break;
    case 0x04:
     this.destAddress = value;
     break;
    case 0x08:
     this.transferLength = value;
     break;
    case 0x0C:
     this.controlRegister = value;
     this.start();
     break;
    case 0x10:
     this.dataSize = value;
     break;
   default:
    throw new Error(`DMA write to invalid offset: 0x${offset.toString(16)}`);
   }
  }

  start() {
   if (this.transferLength === 0) {
    throw new Error("DMA transfer length is zero. Aborting.");
   }

   if (this.controlRegister & 0x01) { // Check Enable bit
    this.bytesTransferred = 0;
    this.transferComplete = false; // Reset the transferComplete flag
    this.performTransfer();
   }
  }

  performTransfer() {
    // Simple implementation: copy 4 bytes from source to destination
    const bytesToCopy = 4; // Fixed-size transfer for now
    
    // Read the 4 bytes from the source address
    const srcBytes = new Uint32Array(this.bus.read(this.sourceAddress));
    
    // Write those bytes to the destination address
    this.bus.write(this.destAddress, srcBytes[0]);
    
    // Update transfer registers and indicate transfer is complete
    this.transferLength = 0;
    this.controlRegister &= 0xFFFFFFFE; // Clear the transfer Complete bit
    this.transferComplete = true;
  }
 }

 module.exports = DMA;
