const MemoryBus = require('../src/bus.js');
const RAM = require('../src/ram.js');

describe('MemoryBus', () => {
    let bus;
    let ram1;
    let ram2;

    beforeEach(() => {
        bus = new MemoryBus();
        ram1 = new RAM(1024);  // 1KB RAM
        ram2 = new RAM(2048);  // 2KB RAM
    });

    it('should attach devices to the bus', () => {
        bus.attach(ram1, 0x00000000, 0x000003FF);
        bus.attach(ram2, 0x00000400, 0x00000BFF);

        expect(bus.devices.length).toBe(2);
    });

    it('should write to attached devices', () => {
        bus.attach(ram1, 0x00000000, 0x000003FF);

        bus.write(0, 0xABCDEF01);

        expect(ram1.read(0)).toBe(0xABCDEF01);
    });

    it('should throw an error if no device is found at the specified address', () => {
        expect(() => {
            bus.read(0x00000000);
        }).toThrow('No device found at address: 0x0');
    });

    it('should throw an error when attaching a device with invalid read/write functions', () => {
        const invalidDevice = {}; // No read/write methods
        expect(() => {
            bus.attach(invalidDevice, 0, 1023);
        }).toThrow("Device must implement read and write functions.");
    });

    it('should throw an error when attaching a device with an invalid address range', () => {
        expect(() => {
            bus.attach(ram1, 1024, 0); // Invalid range
        }).toThrow("Start address must be less than or equal to end address.");
    });

    it('should not allow overlapping ranges', () => {
//TODO: Implement me!
    });
});
