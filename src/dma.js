 // src/dma.js
 class DMA {
  constructor(bus) {
   this.bus = bus;
   this.sourceAddress = 0;
   this.destinationAddress = 0;
   this.transferLength = 0;
   this.controlRegister = 0;
   this.statusAddress = 0;
   this.statusMask = 0;
   this.statusValue = 0;
   this.dataSize = 4; // Default to 32-bit words
   this.transferComplete = false; // Internal flag
   this.interruptHandler = null; // Callback for interrupts
  }

  // Register access methods
  readRegister(offset) {
   switch (offset) {
    case 0x00:
     return this.sourceAddress;
    case 0x04:
     return this.destinationAddress;
    case 0x08:
     return this.transferLength;
    case 0x0C:
     return this.controlRegister;
    case 0x10:
     return this.statusAddress;
    case 0x14:
     return this.statusMask;
    case 0x18:
     return this.statusValue;
    case 0x1C:
     return this.dataSize;
    default:
     throw new Error(`DMA read from invalid offset: 0x${offset.toString(16)}`);
   }
  }

  writeRegister(offset, value) {
   switch (offset) {
    case 0x00:
     this.sourceAddress = value;
     break;
    case 0x04:
     this.destinationAddress = value;
     break;
    case 0x08:
     this.transferLength = value;
      break;
    case 0x0C:
     this.controlRegister = value;
     start();
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
      if (this.transferLength === 0) {
        throw new Error("DMA transfer length is zero. Aborting.");
      }

      // Ensure we're not already in a transfer
      if (this.controlRegister & 0x01) {
        this.transferComplete = false;
        this.controlRegister &= ~0x01; // Clear the enable bit
        if (this.interruptHandler && (this.controlRegister & 0x02)) {
          this.interruptHandler();
        }
      }

      const transferChunk = () => {
        if (!checkStatus() || bytesTransferred >= length) {
          if (bytesTransferred >= length) {
            this.transferComplete = true;
            this.controlRegister &= ~0x01; // Clear the enable bit
            if (this.interruptHandler && (this.controlRegister & 0x02)) { 
              this.interruptHandler();
            }
            return;
          }

          // If no peripheral ready, wait before continuing
          console.log("DMA: Waiting for peripheral to be ready");
          process.nextTick(() => transferChunk()); // Use next tick to avoid blocking
          return;
        }

      // Read data from source and write to destination
      const data = this.bus.read(sourceAddr);
      console.log(`DMA: Transferred data 0x${data.toString(16)} from ${sourceAddr.toString(16)}`);
      this.bus.write(destAddr, data);
      bytesTransferred += 4;
      sourceAddr += 4;
      destAddr += 4;

      // Continue transfer after short delay
      setTimeout(transferChunk, 1); // Use setTimeout to avoid blocking
    };

    const checkStatus = () => {
      const status = this.bus.read(this.statusAddress);
      return (status & this.statusMask) === this.statusValue;
    };

    transferChunk();
  }
 }

 module.exports = DMA;
