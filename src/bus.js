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

        for (const deviceEntry of this.devices) {
            if (address >= deviceEntry.startAddress && address <= deviceEntry.endAddress) {
                const alignedAddress = address - (address % 4); // Word-align the address
                const offsetInWord = address % 4;
                const deviceOffset = alignedAddress - deviceEntry.startAddress;

                const word = deviceEntry.device.read(deviceOffset);

                const buffer = new ArrayBuffer(4);
                const view = new DataView(buffer);
                view.setUint32(0, word, true); // little-endian

                let result;
                switch (size) {
                    case 1:
                        result = view.getUint8(offsetInWord);
                        break;
                    case 2:
                        result = view.getUint16(offsetInWord, true);  // little-endian
                        break;
                    case 4:
                        result = word;
                        break;
                    default:
                        throw new Error("Invalid size");
                }
                return result;
            }
        }

        throw new Error(`No device found at address: 0x${address.toString(16)}`);
    }

    write(address, value, size = 4) {
        if (size !== 1 && size !== 2 && size !== 4) {
            throw new Error("Invalid write size. Must be 1, 2, or 4.");
        }

        for (const deviceEntry of this.devices) {
            if (address >= deviceEntry.startAddress && address <= deviceEntry.endAddress) {
                const alignedAddress = address - (address % 4); // Word-align the address
                const offsetInWord = address % 4;
                const deviceOffset = alignedAddress - deviceEntry.startAddress;

                // Read the original word
                let originalWord = deviceEntry.device.read(deviceOffset);

                const buffer = new ArrayBuffer(4);
                const view = new DataView(buffer);
                view.setUint32(0, originalWord, true); // little-endian

                // Modify the word based on the size
                switch (size) {
                    case 1:
                        view.setUint8(offsetInWord, value & 0xFF);
                        break;
                    case 2:
                        view.setUint16(offsetInWord, value & 0xFFFF, true); // little-endian
                        break;
                    case 4:
                        view.setUint32(0, value, true);
                        break;
                    default:
                        throw new Error("Invalid size");
                }

                let newWord = view.getUint32(0, true);

                // Write the modified word back to memory
                deviceEntry.device.write(deviceOffset, newWord);
                return;
            }
        }

        throw new Error(`No device found at address: 0x${address.toString(16)}`);
    }
}

module.exports = MemoryBus;