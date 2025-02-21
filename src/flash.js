// flash.js

/**
 * @class Flash
 * @description Represents a NAND flash memory device.  It simulates the behavior of flash memory,
 * including initialization to an erased state (all bits set to 1, represented as 0xFF for each byte),
 * reading and writing data (initially only writing 0->1), and handling bounds checking.
 */
class Flash {
    /**
     * @constructor
     * @param {number} sizeInBytes - The size of the flash memory in bytes.
     * @param {Uint8Array} initialData - Optional initial data to load into the flash memory.
     */
    constructor(sizeInBytes, initialData) {
        this.size = sizeInBytes;
        // Initialize the flash memory with all bytes set to 0xFF (erased state)
        this.buffer = new Uint32Array(sizeInBytes).fill(0xFFFFFFFF);
        this.initial = new Uint32Array(initialData);

        // If initial data is provided, load it into the flash memory
        if (initialData) {
            if (initialData.length > sizeInBytes) {
                throw new Error("Initial data exceeds Flash size.");
            }

            for (let i = 0; i < this.initial.length; i++) {
                this.buffer[i] = this.initial[i];
            }
        }

        // Default options, including bounds checking
        this.options = { bounds: true };
    }

    /**
     * @method read
     * @param {number} offset - The offset in bytes from which to read.
     * @returns {number} - The 32-bit word read from the specified offset.
     * @throws {Error} - If the offset is out of bounds or unaligned.
     * @description Reads a 32-bit word from the flash memory at the specified offset.
     */
    read(offset) {
        // Handle special case for empty Flash
        if (this.size === 0) {
            return undefined;
        }

        // Check for out-of-bounds access
        if (offset < 0 || offset >= this.size) {
            if (this.options.bounds) {
                throw new Error(`Flash read out of bounds: offset 0x${offset.toString(16)}`);
            } else {
                return 0xFFFFFFFF; //Return a full word's worth of 0xFF.
            }
        }

        // Check for unaligned access (must be a multiple of 4)
        if (offset % 4 !== 0) {
            throw new Error(`Flash read from unaligned address: 0x${offset.toString(16)}`);
        }

        // Read a 32-bit word from the DataView (little-endian)
        return this.buffer[offset/4];
    }

    /**
     * @method write
     * @param {number} offset - The offset in bytes at which to write.
     * @param {number} value - The value to write.
     * @throws {Error} - Always, because writing is not yet implemented directly on the Flash object.
     * @description  Throws an error to indicate that writing is not yet implemented directly.
     */
    write(offset, value) {
        throw new Error(`Attempted write to Flash at offset: 0x${offset.toString(16)}`);
    }

    /**
     * @method dump
     * @description Dumps the contents of the flash memory to the console.  Useful for debugging.
     */
    dump() {
        console.log(this.buffer);
    }

    /** Download a copy of the flash memory,
     * @returns ArrayBuffer with a copy of the flash memory.
     */
    getSnapshot() {
        const snapshotBuffer = new ArrayBuffer(this.size); // Create an empty buffer with correct length
        const snapshotView = new Uint8Array(snapshotBuffer);

            // Copy the existing data into the new buffer
        for (let i = 0; i < this.size ; i+=4) {
            snapshotView[i] =   (this.buffer[i/4])        &0xFF;
            snapshotView[i+1] = (this.buffer[i/4] >>>8)   &0xFF;
            snapshotView[i+2] = (this.buffer[i/4] >>>16)  &0xFF;
            snapshotView[i+3] = (this.buffer[i/4] >>>24)  &0xFF;

        }

        return snapshotBuffer;
    }


    /**
     * @method getProgrammer
     * @returns {Flash.Programmer} - A new Programmer instance associated with this Flash instance.
     * @description Returns a new Programmer instance that can be used to program this Flash memory.
     */
    getProgrammer() {
        return new Flash.Programmer(this);
    }


    /**
     * @class Programmer
     * @description  A class to provide an interface for programming the flash memory one word at a time.
     *  It implements the read/write API to interact with the flash memory.
     */
    static Programmer = class { //Make the class static so we can use it outside the Flash class.
        /**
         * @constructor
         * @param {Flash} flash - The Flash instance to program.
         */
        constructor(flash) {
            this.flash = flash; // Store the flash instance
            this.controlRegister = 0; // Control register for write enable and other flags.
            this.currentOffset = 0; // Current offset into the flash memory
            this.PAGE_SIZE = 4096;  // Define the page size (4KB)
        }



        /**
         * @method read
         * @param {number} address - The address to read from within the Programmer's registers.
         * @returns {number} - The value read from the specified address.
         * @throws {Error} - If the address is out of range.
         * @description  Reads from the Programmer's registers (0x00: control register, 0x04: offset, 0x08: value, 0x20: Page Erase).
         */
        read(address) {
            switch (address) {
                case 0x00:
                    return this.controlRegister; // Return the control register value.
                case 0x04:
                    return this.currentOffset; // The current offset
                case 0x08:
                    throw new Error("Cannot read directly from the value register, it is write only");
                case 0x20:
                    throw new Error("Cannot read the page erase register, it is write only");
                default:
                    throw new Error(`Address out of range for Flash Programmer read: 0x${address.toString(16)}`);
            }
        }

        /**
         * @method write
         * @param {number} address - The address to write to within the Programmer's registers.
         * @param {number} value - The value to write to the specified address.
         * @throws {Error} - If the address is out of range or if writing is not enabled.
         * @description Writes to the Programmer's registers to enable writing, set the offset, write a value to flash or page Erase.
         *  The control register is a bitmask: bit 0 is write enable, bit 1 is auto-increment enable.
         *              It simulates the NAND flash programming behavior of only being able to change 1 bits to 0 bits.
         */
        write(address, value) {
            switch (address) {
                case 0x00: // Control register
                    this.controlRegister = value; // Update the control register.
                    break;
                case 0x04: // Offset into flash memory
                    this.currentOffset = value;
                    break;
                case 0x08: // Value to modify Flash with
                    // Check if write is enabled (bit 0 of controlRegister is set)
                    if (!(this.controlRegister & 0x01)) {
                        throw new Error("Write enable not set (bit 0 of control register).");
                    }

                    // NAND flash can only change 1s to 0s.
                    // Ensure we don't try to flip any 0s back to 1s.

                    // Read the existing value from flash
                    const currentWord = this.flash.read(this.currentOffset) >>> 0;
                    // Perform a bitwise AND to only clear bits (1 -> 0)
                    const newValue = (currentWord & value) >>> 0;

                    // Write the new value to flash
                    this.flash.buffer[this.currentOffset/4] = newValue;

                    // Auto-increment the offset if auto-increment is enabled (bit 1 of controlRegister is set)
                    if (this.controlRegister & 0x02) {
                        this.currentOffset += 4;
                    }

                    break;
                case 0x20: //Page Erase
                    if (!(this.controlRegister & 0x01)) {
                        throw new Error("Write enable not set (bit 0 of control register) for page erase.");
                    }
                    this.erasePage(value);
                    break;
                default:
                    throw new Error(`Address out of range for Flash Programmer write: 0x${address.toString(16)}`);
            }
        }

        /**
         * @method erasePage
         * @param {number} pageNumber - The page number to erase.
         * @description Erases a 4KB page in the flash memory by setting all bits to 1 (0xFF).
         */
        erasePage(pageNumber) {
            const startAddress = pageNumber * this.PAGE_SIZE;
            const endAddress = startAddress + this.PAGE_SIZE;

            if (startAddress < 0 || endAddress > this.flash.size) {
                throw new Error(`Page number out of range for erase: ${pageNumber}`);
            }

            // Fill the page with 0xFF (erased state)
            for (let i = startAddress; i < endAddress; i++) {
                this.flash.buffer[i] = 0xFF;
            }
        }
    }
}

module.exports = { Flash };
