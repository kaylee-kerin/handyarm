 class MemoryBus {
    constructor() {
        this.devices = [];
    }

    attach(device, startAddress, endAddress) {
        if (typeof device.read !== 'function' || typeof device.write !== 'function') {
            throw new Error("Device must implement read and write functions.");
        }

        // Check against all existing devices to ensure no overlapping ranges
        const isOverlapping = this.devices.some(deviceEntry => 
            Math.max(deviceEntry.start, startAddress) < Math.min(deviceEntry.end, endAddress)
        );

        if (isOverlapping) {
            throw new Error("Attached device overlaps with existing range");
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

    read(address) {
        // Verify the address range
        const start = Math.floor(address / 4) * 4;
        if (address < start || address > start + 3) {
            throw new Error(`Bus.read out of bounds: address 0x${address.toString(16)}`);
        }

        // Find the first device that covers this address
        let alignedAddress = Math.floor(address / 4) * 4;

        // Verify the aligned address is valid
        if (alignedAddress < start || alignedAddress > start + 3) {
            throw new Error(`Bus.read out of bounds: aligned address 0x${alignedAddress.toString(16)}`);
        }

        for (const deviceEntry of this.devices) {
            const { devStart, devEnd } = deviceEntry;
            if (alignedAddress < devStart || alignedAddress > devEnd) {
                continue;
            }

            try {
                // Read all four bytes from the device
                const wordIndex = Math.floor(alignedAddress / 4);
                const byte1 = deviceEntry.device.read(4 * wordIndex);
                const byte2 = deviceEntry.device.read(4 * (wordIndex + 1));
                const byte3 = deviceEntry.device.read(4 * (wordIndex + 2));
                const byte4 = deviceEntry.device.read(4 * (wordIndex + 3));

                // Combine bytes into a single 32-bit value
                return (byte1 << 24) | (byte2 << 16) | (byte3 << 8) | byte4;
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
