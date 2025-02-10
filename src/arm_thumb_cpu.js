const CPU = require('./cpu');

class ARMThumbCPU extends CPU {
    constructor(bus) {
        super(bus);
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
        // Implement CPU reset logic
        console.log("ARMThumbCPU: Resetting CPU");
    }
}

module.exports = ARMThumbCPU;
