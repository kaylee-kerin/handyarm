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
   
   // Bus Fault handler
   this.bus.onBusFault = (error) => {
    console.error(`DMA bus fault: ${error}`);
    this.controlRegister |= 0x01; // Set status register to indicate fault
    this.transferComplete = false; // Reset transfer complete flag
   };
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
     if (value & 0x01) { // Enable bit set
       this.start();
     }
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
    this.transferComplete = false; // Reset the transferComplete flag
    this.performTransfer();
   }
  }

  performTransfer() {
    // Implementation: copy transferLength bytes from source to destination
    
    while (this.transferLength > 0) {
        //TODO: We need to handle a few different scenarios: 
        //source address is not-aligned to a 32-byte boundary
        //destination address is not-aligned to a 32-byte boundary
        //data size could be 1, 2 or 4 bytes per transfer.

        // Read the 4-byte chunk from the source address
        const srcBytes = this.bus.read(this.sourceAddress);
        
        // Write those bytes to the destination address
        this.bus.write(this.destAddress, srcBytes);
        
        // Update transfer registers and handle increment flags
        if (this.controlRegister & 0x02) { // Source increment bit set (bit 1)
            this.sourceAddress += this.dataSize;
        }

        if (this.controlRegister & 0x04) { // Dest increment bit set (bit 2)
            this.destAddress += this.dataSize;
        }

        this.transferLength -= this.dataSize;
    }
    
    // Update transfer registers and indicate transfer is complete
    this.controlRegister &= 0xFFFFFFFE; // Clear the transfer Complete bit
    this.transferComplete = true;
  }
 }

module.exports = {DMA};
