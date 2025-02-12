const CPU = require('../src/cpu');
const ARMThumbCPU = require('../src/arm_thumb_cpu');
const Bus = require('../src/bus');
const RAM = require('../src/ram');
const fs = require('fs');

const ram = new RAM(0x1000); // Example 1KB RAM
const bus = new Bus();
bus.attach(ram, 0x0000, 0x0FFF);

const cpu = new ARMThumbCPU(bus);

// Load a test program into RAM (replace with actual program loading)
const program = fs.readFileSync('test/test_program.bin');
const programDataView = new DataView(program.buffer);

for (let i = 0; i < program.length; i += 4) {
    ram.write(i, programDataView.getUint32(i, true));
}

// Example test case: step through a few instructions
cpu.reset();
cpu.step();
cpu.step();

// Add assertions here to check CPU state, memory, etc.
