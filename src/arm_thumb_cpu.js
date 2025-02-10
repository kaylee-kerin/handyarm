const CPU = require('./cpu');

class ARMThumbCPU extends CPU {
    constructor(bus) {
        super(bus);
        this.regs = new Uint32Array(16); // r0-r15
        this.pc = 0; // Program Counter (r15)
        this.sp = 0; // Stack Pointer (r13)
        this.lr = 0; // Link Register (r14)
        this.apsr = 0; // Application Program Status Register
    }

    fetch() {
        // Implement Thumb instruction fetch
        console.log("ARMThumbCPU: Fetching instruction");
    }

    decode() {
        // Implement Thumb instruction decode
        console.log("ARMThumbCPU: Decoding instruction");
    }

    execute() {
        // Implement Thumb instruction execute
        console.log("ARMThumbCPU: Executing instruction");
    }

    reset() {
        // Implement CPU reset logic, initialize registers, etc.
        this.regs.fill(0);
        this.pc = 0; // Or the reset vector address
        this.sp = 0; // Initial stack pointer value
        this.lr = 0;
        this.apsr = 0;

        console.log("ARMThumbCPU: Resetting CPU");
    }
}

module.exports = ARMThumbCPU;
