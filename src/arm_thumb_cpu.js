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
        try {
            this.currentInstruction = this.bus.read(this.pc);
        } catch (error) {
            // Handle bus error, e.g., set a flag in the APSR
            console.error("Bus error during fetch:", error);
            // ... additional error handling ...
        }
    }
                                                                                                                
     execute() {                                                                                          
         switch (this.currentInstruction >> 8) {                                                                
             case 0x20: // MOVS Rd, #imm                                                                        
                 this.regs[(this.currentInstruction & 0x0700) >> 8] = this.currentInstruction & 0x00FF;         
                 this.pc += 2;                                                                                  
                 break;                                                                                         
             case 0xBF: // NOP                                                                                  
                 this.pc += 2;                                                                                  
                 break;                                                                                         
             default:                                                                                           
                 throw new Error(`Invalid Opcode Prefix: ${this.currentInstructions}`);
         }                                                                                                      
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
