const assert = require('assert');
const { GPIO } = require('../src/GPIO.js');

describe('GPIO', () => {
    let gpio;

    beforeEach(() => {
        gpio = new GPIO();
    });

    describe('constructor', () => {
        it('should initialize _externalDrive to an array of 8 zeros', () => {
            assert.deepStrictEqual(gpio._externalDrive, [0, 0, 0, 0, 0, 0, 0, 0]);
        });

        it('should initialize _output to 0', () => {
            assert.strictEqual(gpio._output, 0);
        });

        it('should initialize _idr to 0', () => {
            assert.strictEqual(gpio._idr, 0);
        });
    });

    describe('setExternalDrive', () => {
        it('should set _externalDrive[pin] to value', () => {
            gpio.setExternalDrive(3, 1);
            assert.strictEqual(gpio._externalDrive[3], 1);

            gpio.setExternalDrive(5, -1);
            assert.strictEqual(gpio._externalDrive[5], -1);

            gpio.setExternalDrive(0, 0);
            assert.strictEqual(gpio._externalDrive[0], 0);
        });

        it('should clear the corresponding bit in _idr if value is negative', () => {
            gpio._idr = 0xFF; // Set all bits to 1
            gpio.setExternalDrive(2, -1);
            assert.strictEqual(gpio._idr & (1 << 2), 0); // Check if bit 2 is 0
        });

        it('should set the corresponding bit in _idr if value is positive', () => {
            gpio._idr = 0; // Set all bits to 0
            gpio.setExternalDrive(7, 1);
            assert.strictEqual(gpio._idr & (1 << 7), 128); // Check if bit 7 is 1
        });

        it('should not change the corresponding bit in _idr if value is 0 (floating)', () => {
            gpio._idr = 0b10101010;
            const originalIdr = gpio._idr;
            gpio.setExternalDrive(3, 0);
            assert.strictEqual(gpio._idr, originalIdr);

            gpio._idr = 0b01010101;
            const originalIdr2 = gpio._idr;
            gpio.setExternalDrive(3, 0);
            assert.strictEqual(gpio._idr, originalIdr2);


        });
    });

    describe('read', () => {
        it('should return _idr when address is 8', () => {
            gpio._idr = 0xABCD;
            assert.strictEqual(gpio.read(8), 0xABCD);
        });

        it('should return 0 for addresses 0, 4, 10, 16, 20, and 24', () => {
            assert.strictEqual(gpio.read(0), 0);
            assert.strictEqual(gpio.read(4), 0);
            assert.strictEqual(gpio.read(10), 0);
            assert.strictEqual(gpio.read(16), 0);
            assert.strictEqual(gpio.read(20), 0);
            assert.strictEqual(gpio.read(24), 0);
        });

        it('should throw an error for invalid addresses', () => {
            assert.throws(() => gpio.read(1), Error, "Invalid read at address: 0x1");
            assert.throws(() => gpio.read(11), Error, "Invalid read at address: 0xb");
            assert.throws(() => gpio.read(25), Error, "Invalid read at address: 0x19");
        });
    });

    describe('write', () => {
        it('should handle BSRR writes correctly', (done) => {
            gpio.on('data', (data) => {
                assert.strictEqual(data, 0b00000011);
                done();
            });

            // Set bits 0 and 1
            gpio.write(16, 0b00000011);
        });

        it('should handle BSRR set and reset writes correctly', (done) => {
            gpio.on('data', (data) => {
                assert.strictEqual(data, 0b00000001);
                done();
            });

            gpio._output = 0b00000010; // Simulate initial output
            // Reset bit 1, set bit 0
            gpio.write(16, 0b000000100000000000000001);
        });

        it('should handle BRR writes correctly', (done) => {
            gpio.on('data', (data) => {
                assert.strictEqual(data, 0);
                done();
            });

            gpio._output = 0b00000011; // Simulate initial output
            gpio.write(20, 0b00000011); // Reset bits 0 and 1
        });

        it('should emit a "data" event with the updated output value after BSRR write', (done) => {
            gpio.on('data', (outputValue) => {
                assert.strictEqual(outputValue, 0x000F); // Example value
                done();
            });
            gpio.write(16, 0x000F); // Example write
        });

        it('should emit a "data" event with the updated output value after BRR write', (done) => {
            gpio.on('data', (outputValue) => {
                assert.strictEqual(outputValue, 0x0005); // Example value, assuming initial value was 0x000F
                done();
            });
            gpio._output = 0x000F; // Set initial value
            gpio.write(20, 0x000A); // Example write
        });


        it('should not throw an error for write to address 0, 4, 8, 12 or 24', () => {
            assert.doesNotThrow(() => gpio.write(0, 0));
            assert.doesNotThrow(() => gpio.write(4, 0));
            assert.doesNotThrow(() => gpio.write(8, 0));
            assert.doesNotThrow(() => gpio.write(12, 0));
            assert.doesNotThrow(() => gpio.write(24, 0));
        });
    });
});