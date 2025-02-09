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
    console.log("transferLength:", value);
     break;
    case 0x0C:
     this.controlRegister = value;
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
   let bytesTransferred = 0;
   let sourceAddr = this.sourceAddress;
   let destAddr = this.destinationAddress;
   let length = this.transferLength;
   let status;
   let maskedStatus;

   const checkStatus = () => {
    status = this.bus.read(this.statusAddress);
    maskedStatus = status & this.statusMask;
    return maskedStatus === this.statusValue;
   };

   const transferChunk = () => {
    console.log(`DMA: bytesTransferred=${bytesTransferred}, length=${length}, sourceAddr=0x${sourceAddr.toString(16)}, destAddr=0x${destAddr.toString(16)}`); // Debugging

    if (bytesTransferred >= length || !(this.controlRegister & 0x01)) {
     this.transferComplete = true;
     this.controlRegister &= ~0x01; // Clear the enable bit
     if (this.interruptHandler && (this.controlRegister & 0x02)) { //Check Interrupt Enable bit
      this.interruptHandler();
     }
     return;
    }

    if (!checkStatus()) {
     console.log("DMA: Waiting for peripheral to be ready");
     // Wait for the peripheral to be ready
     setTimeout(transferChunk, 0); // Use setTimeout to avoid blocking
     return;
    }

    // read from memory in words
    let data = this.bus.read(sourceAddr);
    console.log(`DMA: Read data 0x${data.toString(16)} from address 0x${sourceAddr.toString(16)}`);
    this.bus.write(destAddr, data);
    console.log(`DMA: Wrote data 0x${data.toString(16)} to address 0x${destAddr.toString(16)}`);

    bytesTransferred += 4;
    sourceAddr += 4;
    destAddr += 4;

    setTimeout(transferChunk, 0); // Continue the transfer asynchronously
   };

   transferChunk(); // Start the initial transfer
  }
 }

 module.exports = DMA;