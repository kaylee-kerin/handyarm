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

    it('should read from attached devices', () => {
        bus.attach(ram1, 0x00000000, 0x000003FF);
        ram1.write(0, 0x12345678);

        const value = bus.read(0);
        expect(value).toBe(0x12345678);
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

    it('should read and write bytes, halfwords, and words correctly', () => {
        bus.attach(ram1, 0x00000000, 0x000003FF);

        bus.write(0, 0x12345678);

        expect(bus.read(0, 1)).toBe(0x78);
        expect(bus.read(1, 1)).toBe(0x56);
        expect(bus.read(2, 1)).toBe(0x34);
        expect(bus.read(3, 1)).toBe(0x12);

        expect(bus.read(0, 2)).toBe(0x5678);
        expect(bus.read(2, 2)).toBe(0x1234);

        expect(bus.read(0, 4)).toBe(0x12345678);

        // Test read from multiple devices
        const ram3 = new RAM(1024);
        bus.attach(ram3, 0x00000400, 0x000007FF);

        ram1.write(0x400, 0x55555555);
        ram2.write(0x400, 0xAAAAAAA);
        
        expect(bus.read(0x400)).toBe(0xAAAAAAA); // Should read from ram2
        expect(bus.read(0x500)).toBe(0x55555555); // Should read from ram3
        
        // Test write to multiple devices
        bus.write(0x400, 0x66666666);
        expect(ram1.read(0x400)).toBe(0x66666666);
        expect(ram2.read(0x400)).not.toBe(0x66666666);
        expect(ram3.read(0x400)).toBe(0x66666666);

        // Test bus bandwidth
        let loopCount = 0;
        const address = 0x00000000;
        const value = 0x123456789ABCDEF0;
        
        for (let i = 0; i < 1000; i++) {
            bus.write(address, value);
            expect(ram1.read(address)).toBe(value);
        }

        expect(loopCount).toBe(1000);

        // Continue with existing test
        expect(bus.read(0)).toBe(0x123456AA);

        bus.write(2, 0xBBCC, 2);
        expect(bus.read(0)).toBe(0x12BBCCAA);

        bus.write(0, 0x11223344, 4);
        expect(bus.read(0)).toBe(0x11223344);
    });

    it('should throw an error for invalid read/write sizes', () => {
        bus.attach(ram1, 0x00000000, 0x000003FF);
        expect(() => bus.read(0, 3)).toThrow('Invalid read size. Must be 1, 2, or 4.');
        expect(() => bus.write(0, 0, 3)).toThrow('Invalid write size. Must be 1, 2, or 4.');
    });

    it('should handle overlapping device ranges by selecting the first match', () => {
        const ram3 = new RAM(1024);
        bus.attach(ram1, 0x00000000, 0x000003FF); // Range 1
        bus.attach(ram2, 0x00000200, 0x000007FF); // Overlapping range
        bus.attach(ram3, 0x00000400, 0x000007FF); // Another overlapping range

        ram1.write(0x200, 0xAAAAAAAA);
        ram2.write(0, 0xBBBBBBBB);
        ram3.write(0, 0xCCCCCCCC);

        expect(bus.read(0x200)).toBe(0xAAAAAAAA); // Should read from ram1
        expect(bus.read(0x400)).toBe(0xBBBBBBBB); // Should read from ram2

        bus.write(0x200, 0xDDDDDDDD);
        expect(ram1.read(0x200)).toBe(0xDDDDDDDD); // Should write to ram1
        expect(ram2.read(0)).not.toBe(0xDDDDDDDD); // ram2 should not be affected
    });
});
