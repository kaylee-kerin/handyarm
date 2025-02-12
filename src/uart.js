 // uart.js
class UART {
  constructor() {
   this.rxData = 0; // Received data
   this.txData = 0; // Transmitted data (for testing)
   this.onTransmit = null; // Callback for transmitting data
   this.statusRegister = 0x02; // TX Empty is set, RX Not Full
  }

  // Simulates receiving data from the UART
  receive(data) {
   this.rxData = data & 0xFF; // Only keep the lower 8 bits.
  }

  read(offset) {
   if (offset === 0) { // Data register
    return this.rxData;
   } else if (offset === 4) { // Status register
    return this.statusRegister;
   } else {
    console.warn(`UART read from invalid offset: 0x${offset.toString(16)}`);
    return 0; // Or throw an error, depending on your design
   }
  }

  write(offset, value) {
   if (offset === 0) { // Data register
    this.txData = value & 0xFF; // Store the value (for testing)

    if (this.onTransmit) {
     this.onTransmit(value & 0xFF); // Call the transmit callback
    }

   } else {
    console.warn(`UART write to invalid offset: 0x${offset.toString(16)}`);
    // Optionally throw an error here. For now just warn.
   }
  }
 }

module.exports = {UART};
