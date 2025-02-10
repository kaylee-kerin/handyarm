let RAM = require('../src/ram.js');
let Bus = require('../src/bus.js');
let ARMThumbCPU = require('../src/arm_thumb_cpu.js');


describe("ARMThumbCPU", () => {                                                                                
     let cpu, bus, ram;                                                                                         
                                                                                                                
     beforeEach(() => {                                                                                         
         ram = new RAM(0x1000); // Example 1KB RAM                                                              
         bus = new Bus();                                                                                       
         bus.attach(ram, 0x0000, 0x0FFF);                                                                       
                                                                                                                
         cpu = new ARMThumbCPU(bus);                                                                            
     });                                                                                                        
                                                                                                                
     it("should reset the CPU registers to 0", () => {                                                          
         cpu.reset();                                                                                           
                                                                                                                
         expect(cpu.regs.every(reg => reg === 0)).toBe(true);                                                   
         expect(cpu.pc).toBe(0x00000000);                                                                       
         expect(cpu.sp).toBe(0x00000000);                                                                       
         expect(cpu.lr).toBe(0x00000000);                                                                       
         expect(cpu.apsr).toBe(0x00000000);                                                                     
     });                                                                                                        
                                                                                                                
     it("should fetch, decode, and execute a NOP instruction", () => {                                          
         // Load a simple program into RAM.                                                                     
         const program = new Uint32Array([0xBF00]); // Example instruction: NOP                                 
         for (let i = 0; i < program.length; ++i) {                                                             
             ram.write(i * 4, program[i]);                                                                      
         }                                                                                                      
                                                                                                                
         cpu.reset();                                                                                           
         cpu.step();                                                                                            
                                                                                                                
         // PC should have incremented by 2 (Thumb instruction size)                                            
         expect(cpu.pc).toBe(0x00000002);                                                                       
     });                                                                                                        
                                                                                                                
     it("should fetch, decode, and execute a MOV instruction", () => {                                          
         // Load a simple program into RAM.                                                                     
         const program = new Uint32Array([0x2001]); // Example instruction: MOVS r0, #1                         
                                                                                                                
         for (let i = 0; i < program.length; ++i) {                                                             
             ram.write(i * 4, program[i]);                                                                      
         }                                                                                                      
                                                                                                                
         cpu.reset();                                                                                           
         cpu.step();                                                                                            
                                                                                                                
         // PC should have incremented by 2 (Thumb instruction size)                                            
         expect(cpu.pc).toBe(0x00000002);                                                                       
                                                                                                                
         //r0 should be 1                                                                                       
         expect(cpu.regs[0]).toBe(0x00000001);                                                                  
     });                                                                                                        
 });           
