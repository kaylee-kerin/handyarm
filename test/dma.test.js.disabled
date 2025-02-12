
const BUS = require('../src/bus');
const RAM = require('../src/ram');
const DMA = require('../src/dma');

describe('DMA', () => {
  let memoryBus;
  let ram;
  let peripheral1, peripheral2;
  let dma;

  beforeEach(() => {
    // Setup the bus
    bus = new BUS();
    ram = new RAM(0x2000); // Create enough space for our tests
    bus.attach(ram,0x0,0x1FFF);

//some data to work with.
    ram.write(0x0,0xDEADBEEF);
    ram.write(0x4,0xAABBCCDD);
    ram.write(0x8,0xEEFF0011);
    ram.write(0xC,0x22334455);

    // Setup the DMA with our real bus implementation
    dma = new DMA(bus);
  });

  it('should copy data from one ram to another ram', () => {
    dma.write(0x00, 0x0); // Source address
    dma.write(0x04, 0x20); // Destination address
    dma.write(0x08, 0x10); // Transfer length (16 bytes)
    dma.write(0x10, 0x04); // bytes to increment per read for auto-increment.


    dma.write(0x0C, 0x01 | 0x02 | 0x04); // Control register (enable DMA, increment source and destination)
    
    //now we wait for the DMA to finish
    while((dma.read(0x0C) & 0x1)){
       ;
    }
    //once it's done, we can check that the data is where we expect it to be.
    expect(ram.read(0x20)).toBe(0xDEADBEEF);
    expect(ram.read(0x24)).toBe(0xAABBCCDD);
    expect(ram.read(0x28)).toBe(0xEEFF0011);
    expect(ram.read(0x2C)).toBe(0x22334455);
  });

  it('An 8-bit read can be spread across some ram', () => {
    dma.write(0x00, 0x0); // Source address
    dma.write(0x04, 0x20); // Destination address
    dma.write(0x08, 0x10); // Transfer length (16 bytes)
    dma.write(0x10, 0x01); // bytes to increment per read for auto-increment.


    dma.write(0x0C, 0x01 | 0x04); // Control register (enable DMA, increment destination)
    
    //now we wait for the DMA to finish
    while((dma.read(0x0C) & 0x1)){
       ;
    }

    ram.dump();
    //once it's done, we can check that the data is where we expect it to be.
    expect(ram.read(0x20)).toBe(0xDEDEDEDE);
    expect(ram.read(0x24)).toBe(0xDEDEDEDE);
    expect(ram.read(0x28)).toBe(0xDEDEDEDE);
    expect(ram.read(0x2C)).toBe(0xDEDEDEDE);
  });

  

});
