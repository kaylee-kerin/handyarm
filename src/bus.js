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

        // Verify the address range
        const start = Math.floor(address / 4) * 4;
        if (address < start || address > start + size * 3) {
            throw new Error(`Address out of bounds for size ${size}`);
        }

        console.log(`Bus.read(0x${address.toString(16, 8)}, ${size})`);

        let result = null;
        const alignedAddress = Math.floor(address / 4) * 4;

        // Find the first device that covers this address
        for (const deviceEntry of this.devices) {
            const { start: devStart, end: devEnd } = deviceEntry;
            if (address > devEnd || address < devStart) {
                continue;
            }

            try {
                // Get the full word at aligned address
                const wordIndex = Math.floor(alignedAddress / 4);
                const word = deviceEntry.device.read(4 * wordIndex);
                
                // Extract specific bytes based on size and offset
                const offset = alignedAddress % 4;
                switch (size) {
                    case 1:
                        result = ((word >> offset) & 0xFF);
                        break;
                    case 2:
                        result = ((word >> (offset * 2)) & 0xFFFF);
                        break;
                    case 4:
                        result = word;
                        break;
                }
                
                // If we found matching device, return the value
                if (result !== null) {
                    console.log(`Found matching device at ${devStart.toString(16, 8)}-${devEnd.toString(16, 8)}`);
                    return result;
                }
            } catch (error) {
                console.error(`Error reading from device: ${error.message}`);
            }
        }

        throw new Error(`No device found at address: 0x${address.toString(16)}`);
    }

    write(address, value, size = 4) {
        if (size !== 1 && size !== 2 && size !== 4) {
            throw new Error("Invalid write size. Must be 1, 2, or 4.");
        }

        // Word-align the address
        const alignedAddress = Math.floor(address / 4) * 4;
        const offsetInWord = address % 4;

        for (const deviceEntry of this.devices) {
            if (address < deviceEntry.startAddress || address > deviceEntry.endAddress) {
                continue;
            }

            try {
                // Calculate which word in the device's memory we're accessing
                const deviceOffset = alignedAddress - deviceEntry.startAddress;
                const deviceWordIndex = Math.floor(deviceOffset / 4);

                // Get current word from the device
                const originalWord = deviceEntry.device.read(4 * deviceWordIndex);

                // Create a buffer to modify the word
                const buffer = new ArrayBuffer(4);
                const view = new DataView(buffer);
                
                // Set desired value into the buffer
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
                }

                const newWord = view.getUint32(0, true);

                // Write the modified word back to the device
                deviceEntry.device.write(deviceOffset, newWord, 4);
            } catch (error) {
                console.error(`Error writing to device: ${error.message}`);
            }
        }
    }
}

module.exports = MemoryBus;
