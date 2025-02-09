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
            Math.max(deviceEntry.startAddress, startAddress) < Math.min(deviceEntry.endAddress, endAddress)
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
                return deviceEntry.device.read(alignedAddress-deviceEntry.startAddress);
	    }catch(error){
		//TODO: Implement a "Bus Fault" handler trigger here.
		throw error;
            }
        }

        throw new Error(`No device found at address: 0x${address.toString(16)}`);
    }

    write(address, value, size = 4) {
        let alignedAddress = Math.floor(address / 4) * 4;
        
        // Verify the aligned address range
        const start = Math.floor(alignedAddress / 4) * 4;
        if (alignedAddress < start || alignedAddress > start + 3) {
            throw new Error(`Bus.write out of bounds: address 0x${alignedAddress.toString(16)}`);
        }

        // Find the appropriate device
        for (const deviceEntry of this.devices) {
            const { devStart, devEnd } = deviceEntry;
            if (alignedAddress >= devStart && alignedAddress <= devEnd) {
                const baseOffset = alignedAddress - devStart;
                const remainingSpace = devEnd - devStart;
                
                // Ensure we don't exceed the device's memory
                if ((baseOffset + size * 4) > remainingSpace) {
                    throw new Error(`Bus.write would exceed device memory: address 0x${alignedAddress.toString(16)}`);
                }

                for (let i = 0; i < size; i++) {
                    const chunkValue = (value >> (i * 4)) & 0xFFFFFFFF;
                    const offset = baseOffset + (i * 4);
                    try {
                        deviceEntry.device.write(offset, chunkValue);
                    } catch (error) {
                        // TODO: Implement a "Bus Fault" handler trigger here.
                        throw error;
                    }
                }
                
                return;
            }
        }

        throw new Error(`No device found at address: 0x${address.toString(16)}`);
    },
}

module.exports = MemoryBus;
