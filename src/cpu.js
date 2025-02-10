class CPU {
    constructor(bus) {
        if (!bus) {
            throw new Error("CPU must be initialized with a bus object.");
        }
        this.bus = bus;
    }

    // Placeholder methods for subclasses to implement
    fetch() {
        throw new Error("fetch() not implemented for this CPU architecture.");
    }

    decode() {
        throw new Error("decode() not implemented for this CPU architecture.");
    }

    execute() {
        throw new Error("execute() not implemented for this CPU architecture.");
    }

    step() {
        this.fetch();
        this.decode();
        this.execute();
    }

    reset() {
        throw new Error("reset() not implemented for this CPU architecture.");
    }
}


module.exports = CPU;
