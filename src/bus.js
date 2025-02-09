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
            const { startAddress, endAddress } = deviceEntry;
            if (alignedAddress < startAddress || alignedAddress > endAddress) {
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
        // Align the address to 4-byte boundary
        const alignedAddress = Math.floor(address / 4) * 4;
        
        // Verify the aligned address is within the bus range
        if (alignedAddress < this.startAddress || alignedAddress > this.endAddress) {
            throw new Error(`Bus.write out of bounds: aligned address 0x${alignedAddress.toString(16)}`);
        }

        // Calculate how many bytes to write
        const bytesToWrite = Math.min(size, (this.endAddress - this.startAddress) / 4);
        
        // Find the appropriate device that services this address
        let offsetInDevice = alignedAddress - this.startAddress;
        for (const deviceEntry of this.devices) {
            if (offsetInDevice < 0 || offsetInDevice >= deviceEntry.device.endAddress - deviceEntry.device.startAddress) {
                continue;
            }
            try {
                // Write all bytes to the device
                const bytesToWrite = Math.min(size, 
                    ((deviceEntry.device.endAddress - deviceEntry.device.startAddress) >> 2));
                
                const data = [];
                for (let i = 0; i < bytesToWrite * 4; i += 4) {
                    data.push(value & 0xFF);
                    data.push((value >> 8) & 0xFF);
                    data.push((value >> 16) & 0xFF);
                    data.push((value >> 24) & 0xFF);
                }
                
                deviceEntry.device.write(offsetInDevice, data.shift());
            } catch (error) {
                // TODO: Implement a "Bus Fault" handler trigger here.
                throw error;
            }
        }

        throw new Error(`No device found at address: 0x${address.toString(16)}`);
    }
}

module.exports = MemoryBus;
