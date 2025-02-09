performTransfer() {
    // Implementation: copy transferLength bytes from source to destination
    
    while (this.transferLength > 0) {
        const srcBytes = this.bus.read(this.sourceAddress);
        
        if (this.dataSize === 1) { // Handle single byte transfers
            this.bus.write(this.destAddress, srcBytes & 0xFF);
        } else if (this.dataSize === 2) { // Handle two byte transfers
            this.bus.write(this.destAddress, (srcBytes >> 8) | ((srcBytes & 0xFF) << 8));
        } else { // Handle four byte transfers
            this.bus.write(this.destAddress, srcBytes);
        }
        
        if (this.controlRegister & 0x02) { // Source increment bit set (bit 1)
            this.sourceAddress += this.dataSize;
        }

        if (this.controlRegister & 0x04) { // Dest increment bit set (bit 2)
            this.destAddress += this.dataSize;
        }

        this.transferLength -= this.dataSize;

        // Handle bus faults
        const faultStatus = this.bus.read(0x0C);
        if (faultStatus & 0x01) {
            throw new Error(`Bus fault: DMA transfer failed`);
        }
    }
    
    // Update transfer registers and indicate transfer is complete
    this.controlRegister &= 0xFFFFFFFE; // Clear the transfer Complete bit
    this.transferComplete = true;
}
