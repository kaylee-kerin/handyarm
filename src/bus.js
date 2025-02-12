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
                return deviceEntry.device.read(alignedAddress - deviceEntry.startAddress);
            } catch (error) {
                // Implement a "Bus Fault" handler trigger here.
                //console.error("Bus read error:", error);
                // For now, re-throw the error
                throw error;
            }
        }

        // If no device is found, return a default value (or throw an error)
        throw new Error(`No device found at address: 0x${address.toString(16)}`);
    }

    write(address, value) { // Removed size parameter as it's not used
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
                deviceEntry.device.write(alignedAddress-deviceEntry.startAddress,value);
      		    return;
	    }catch(error){
		//TODO: Implement a "Bus Fault" handler trigger here.
                throw error;
            }
        }
	
        throw new Error(`No device found at address: 0x${address.toString(16)}`);
    }
}


module.exports = {MemoryBus};
