 class MemoryBus {
    constructor() {
        this.devices = [];
    }

    attach(device, startAddress, endAddress) {
        if (typeof device.read !== 'function' || typeof device.write !== 'function') {
            throw new Error("Device must implement read and write functions.");
        }

        if (startAddress > endAddress) {
            throw new Error("Start address must be less than or equal to end address.");
        }

        this.devices.push({
            device,
            startAddress,
            endAddress
        });
    }

    read(address, size = 4) {
        if (size !== 1 && size !== 2 && size !== 4) {
            throw new Error("Invalid read size. Must be 1, 2, or 4.");
        }

        // Debug: Log the address being read
        console.log(`Bus.read(0x${address.toString(16, 8)}, ${size})`);

        let result = null;
        for (const deviceEntry of this.devices) {
            // Check if address falls within device's range
            const start = deviceEntry.startAddress;
            const end = deviceEntry.endAddress;
            if (address >= start && address <= end) {
                try {
                    // Read the exact number of bytes needed, considering word alignment
                    const alignedAddress = address - (address % 4);
                    const offsetInWord = address % 4;
                    
                    // Determine which word we're reading from the device
                    const wordIndex = Math.floor(alignedAddress / 4);
                    const byteOffsetWithinWord = offsetInWord;

                    // Read the word from the device, then extract specific bytes
                    const wordValue = deviceEntry.device.read(4 * wordIndex);
                    
                    // Rebuild the result based on the word and size
                    switch (size) {
                        case 1:
                            result = ((wordValue >> byteOffsetWithinWord) & 0xFF);
                            break;
                        case 2:
                            result = ((wordValue >> (byteOffsetWithinWord * 2)) & 0xFFFF);
                            break;
                        case 4:
                            result = wordValue;
                            break;
                        default:
                            throw new Error("Invalid size");
                    }
                    
                    console.log(`Found matching device at 0x${start.toString(16, 8)}-0x${end.toString(16, 8)} returning value 0x${result.toString(16, 8)}`);
                } catch (error) {
                    console.error(`Error reading from device: ${error.message}`);
                }
            }
        }

        if (!result) {
            throw new Error(`No device found at address: 0x${address.toString(16)}`);
        }

        let result;
        for (const deviceEntry of this.devices) {
            // Check if address falls within device's range
            const start = deviceEntry.startAddress;
            const end = deviceEntry.endAddress;
            
            if (address < start || address > end) {
                continue;
            }

            // Word-align the address
            const alignedAddress = address - (address % 4);
            const offsetInWord = address % 4;

            // Find which word in the device's memory we're accessing
            const deviceOffset = alignedAddress - start;
            const deviceWordIndex = Math.floor(deviceOffset / 4);

            // Read the word from the device
            const word = deviceEntry.device.read(4 * deviceWordIndex);

            // Rebuild the result based on the word and size
            switch (size) {
                case 1:
                    result = ((word >> (offsetInWord)) & 0xFF);
                    break;
                case 2:
                    result = ((word >> (2 * offsetInWord)) & 0xFFFF);
                    break;
                case 4:
                    result = word;
                    break;
                default:
                    throw new Error("Invalid size");
            }
        }

        if (!result) {
            throw new Error(`No device found at address: 0x${address.toString(16)}`);
        }
    }

    write(address, value, size = 4) {
        if (size !== 1 && size !== 2 && size !== 4) {
            throw new Error("Invalid write size. Must be 1, 2, or 4.");
        }

        // Word-align the address
        const alignedAddress = address - (address % 4);
        const offsetInWord = address % 4;

        for (const deviceEntry of this.devices) {
            if (address < deviceEntry.startAddress || address > deviceEntry.endAddress) {
                continue;
            }

            // Calculate which word in the device's memory we're accessing
            const deviceOffset = alignedAddress - deviceEntry.startAddress;
            const deviceWordIndex = Math.floor(deviceOffset / 4);

            // Read the current word from the device at this offset
            let originalWord = deviceEntry.device.read(4 * deviceWordIndex);

            // Create a buffer to modify the word
            const buffer = new ArrayBuffer(4);
            const view = new DataView(buffer);
            
            switch (size) {
                case 1:
                    view.setUint8(offsetInWord, value);
                    break;
                case 2:
                    view.setUint16(offsetInWord, value, true); // little-endian
                    break;
                case 4:
                    view.setUint32(0, value, true);
                    break;
                default:
                    throw new Error("Invalid size");
            }

            const newWord = view.getUint32(0, true);

            // Write the modified word back to the device
            deviceEntry.device.write(deviceOffset, newWord);
        }
    }
}

module.exports = MemoryBus;
