const { MemoryBus } = require('../src/bus.js');
const { RAM } = require('../src/ram.js');

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
    
    it('should read from attached devices', () => {
        bus.attach(ram1, 0x00100000, 0x001003FF);
        ram1.write(0, 0xABCDEF01);
        expect(bus.read(0x00100000)).toBe(0xABCDEF01);
    });

    it('should read from the correct attached device', () => {
        bus.attach(ram1, 0x00100000, 0x001003FF);
        bus.attach(ram2, 0x00200000, 0x002003FF);
        ram1.write(0, 0xABCDEF01);
        ram2.write(0, 0xDEADBEEF);
        expect(bus.read(0x00100000)).toBe(0xABCDEF01);
    });

    it('should write to attached devices', () => {
        bus.attach(ram1, 0x00100000, 0x001003FF);
        bus.write(0x00100004, 0xABCDEF01);
        expect(ram1.read(0x4)).toBe(0xABCDEF01);
    });
    
    it('should write to the correct attached device', () => {
        bus.attach(ram1, 0x00100000, 0x001003FF);
        bus.attach(ram2, 0x00200000, 0x002003FF);
        bus.write(0x00100004, 0xABCDEF01);
        expect(ram1.read(0x4)).toBe(0xABCDEF01);
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
        expect(() => {
            bus.attach(ram1, 0x00000000, 0x000003FF);
            bus.attach(ram2, 0x00000200, 0x000005FF);
        }).toThrow();
    });

    it('should throw an error for out of bounds read attempts', () => {
        expect(() => {
            bus.read(0x00000100); // Address beyond both devices
        }).toThrow();
    });
});
