// flash.test.js

const assert = require('assert');
const { Flash } = require('../src/flash.js');

describe('Flash Memory and Programmer Tests', () => {
    let flash;
    let programmer;
    const FLASH_SIZE = 65536; // 64KB
    const PAGE_SIZE = 4096;   // 4KB

    beforeEach(() => {
        flash = new Flash(FLASH_SIZE);
        programmer = flash.getProgrammer();
    });

    describe('Flash Class', () => {
        it('should initialize with all bytes set to 0xFF', () => {
            for (let i = 0; i < FLASH_SIZE; i++) {
                assert.strictEqual(flash.buffer[i], 0xFF, `Byte at index ${i} is not 0xFF`);
            }
        });

        it('should throw an error when reading out of bounds', () => {
            assert.throws(() => flash.read(-1), Error, 'Reading negative offset should throw error');
            assert.throws(() => flash.read(FLASH_SIZE), Error, 'Reading at FLASH_SIZE should throw error');
            assert.throws(() => flash.read(FLASH_SIZE + 1), Error, 'Reading beyond FLASH_SIZE should throw error');
        });

        it('should return 0xFFFFFFFF when reading out of bounds with bounds checking disabled', () => {
            flash.options.bounds = false;
            assert.strictEqual(flash.read(-1), 0xFFFFFFFF, 'Reading negative offset should return 0xFFFFFFFF');
            assert.strictEqual(flash.read(FLASH_SIZE), 0xFFFFFFFF, 'Reading at FLASH_SIZE should return 0xFFFFFFFF');
        });

        it('should throw an error when reading from an unaligned address', () => {
            assert.throws(() => flash.read(1), Error, 'Reading from unaligned address should throw error');
            assert.throws(() => flash.read(5), Error, 'Reading from unaligned address should throw error');
        });

        it('should throw an error when writing directly to Flash', () => {
            assert.throws(() => flash.write(0, 0x12345678), Error, 'Writing to Flash directly should throw error');
        });

        it('should load initial data correctly', () => {
            const initialData = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
            flash = new Flash(FLASH_SIZE, initialData);
            assert.strictEqual(flash.buffer[0], 0x01);
            assert.strictEqual(flash.buffer[1], 0x02);
            assert.strictEqual(flash.buffer[7], 0x08);
            assert.strictEqual(flash.read(0), 0x04030201);
        });

        it('should truncate initial data if it exceeds flash size', () => {
            const initialData = new Uint8Array(FLASH_SIZE + 10);
            assert.throws(() => flash = new Flash(FLASH_SIZE, initialData), Error);
        });

        it('should read existing data correctly', () => {
          // Set some data in the flash memory
          const initialData = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0]);
          flash = new Flash(FLASH_SIZE, initialData);

          // Read the data using flash.read()
          const data = flash.read(0);
          assert.strictEqual(data, 0x78563412, "Read data does not match initial data");
        });
    });

    describe('Programmer Class', () => {
        it('should initialize with write enable disabled and offset 0', () => {
            assert.strictEqual(programmer.controlRegister, 0);
            assert.strictEqual(programmer.currentOffset, 0);
        });

        it('should enable and disable write enable via control register', () => {
            programmer.write(0x00, 1);
            assert.strictEqual(programmer.controlRegister, 1, 'Write enable should be set');
            programmer.write(0x00, 0);
            assert.strictEqual(programmer.controlRegister, 0, 'Write enable should be cleared');
        });

        it('should set the offset', () => {
            programmer.write(0x04, 0x1000);
            assert.strictEqual(programmer.currentOffset, 0x1000, 'Offset should be set');
        });

        it('should throw an error when reading the value register', () => {
          assert.throws(() => programmer.read(0x08), Error, 'Reading from value register should throw an error');
        });

        it('should throw an error when writing without write enable', () => {
            assert.throws(() => programmer.write(0x08, 0x12345678), Error, 'Writing without write enable should throw error');
        });

        it('should write value to flash, changing 1s to 0s only, and auto-increment', () => {
            //Initial data
            const initialData = new Uint8Array(FLASH_SIZE);
            initialData.fill(0xFF);
            flash = new Flash(FLASH_SIZE, initialData);
            programmer = flash.getProgrammer();

            programmer.write(0x00, 0x03); // Enable write and auto-increment
            programmer.write(0x04, 0);      // Set offset to 0
            programmer.write(0x08, 0x0F0F0F0F); // Write value

            assert.strictEqual(flash.read(0), 0x0F0F0F0F, 'Value should be written correctly');
            assert.strictEqual(programmer.currentOffset, 4, 'Offset should be auto-incremented');

            programmer.write(0x08, 0x00000000); //Clear all bits
            assert.strictEqual(flash.read(4), 0x00000000, 'All bits should be zero.');

        });

        it('should only change 1s to 0s', () => {
            flash = new Flash(FLASH_SIZE, new Uint8Array([0xFF, 0x00, 0x00, 0x00]));
            programmer = flash.getProgrammer();

            programmer.write(0x00, 0x03); // Enable write and auto-increment
            programmer.write(0x04, 0);      // Set offset to 0
            programmer.write(0x08, 0xFF00FF00); // Write value

            assert.strictEqual(flash.read(0), 0x00000000, 'Only 1s should be changed to 0s');
        });

        it('should not auto-increment when auto-increment is disabled', () => {
            programmer.write(0x00, 0x01); // Enable write but not auto-increment
            programmer.write(0x04, 0);
            programmer.write(0x08, 0x12345678);
            assert.strictEqual(programmer.currentOffset, 0, 'Offset should not be auto-incremented');
        });

        it('should erase a page correctly', () => {
            // Write some data to a page
            programmer.write(0x00, 0x03); // Enable write and auto-increment
            programmer.write(0x04, 0);      // Set offset to 0
            programmer.write(0x08, 0x00000000); // Clear all bits in page 0

            // Erase the page
            programmer.write(0x00, 0x01);
            programmer.write(0x20, 0); // Erase page 0

            // Verify that the page is erased
            for (let i = 0; i < PAGE_SIZE; i++) {
                assert.strictEqual(flash.buffer[i], 0xFF, `Byte at index ${i} should be 0xFF after erase`);
            }
        });

        it('should throw an error when erasing a page out of range', () => {
            programmer.write(0x00, 0x01);
            assert.throws(() => programmer.write(0x20, FLASH_SIZE / PAGE_SIZE), Error, 'Erasing a page out of range should throw error');
        });

        it('should throw an error when erasing a page with write enable disabled', () => {
            assert.throws(() => programmer.write(0x20, 0), Error, 'Erasing a page with write enable disabled should throw error');
        });

        it('should write a sequence of words correctly', () => {
          const initialData = new Uint8Array(FLASH_SIZE);
          initialData.fill(0xFF);
          flash = new Flash(FLASH_SIZE, initialData);
          programmer = flash.getProgrammer();

          const startAddress = 0x100;
          const dataToWrite = [0x12345678, 0x9ABCDEF0, 0x11223344, 0x55667788];
          const byteLength = dataToWrite.length * 4;

          programmer.write(0x00, 0x03); // Enable write and auto-increment
          programmer.write(0x04, startAddress);

          for (const word of dataToWrite) {
            programmer.write(0x08, word);
          }

          for (let i = 0; i < dataToWrite.length; i++) {
            assert.strictEqual(flash.read(startAddress + (i * 4)), dataToWrite[i], `Word at offset ${startAddress + (i * 4)} does not match`);
          }
          assert.strictEqual(programmer.currentOffset, startAddress+byteLength, 'Offset should be auto-incremented to the end');

        });
    });
});
