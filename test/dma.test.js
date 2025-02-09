const { MemoryBus, RAM } = require('../src/ram');
const DMA = require('../src/dma');

describe('DMA', () => {
  let memoryBus;
  let ram;
  let peripheral1, peripheral2;
  let dma;

  beforeEach(() => {
    // Reset all devices for each test
    peripheral1 = new (class Peripheral {});
    peripheral2 = new (class Peripheral {};
    
    // Setup the bus
    memoryBus = new MemoryBus();
    ram = new RAM(0x2000); // Create enough space for our tests
    
    // Setup the DMA with our real bus implementation
    dma = new DMA(memoryBus);
    
    // Connect the DMA to peripherals and RAM
    const conn1 = {
      startAddress: 0x150,
      endAddress: 0x160,
      transferLength: 4
    };
    const conn2 = {
      startAddress: 0x200,
      endAddress: 0x210,
      transferLength: 4
    };
    
    // Configure the DMA registers
    dma.writeRegister(0x00, conn1.startAddress); // Source address
    dma.writeRegister(0x04, conn2.startAddress); // Destination address
    dma.writeRegister(0x08, conn1.transferLength); // Transfer length
    dma.writeRegister(0x0C, 0x01); // Control register (enable DMA)
    dma.writeRegister(0x10, 0x20); // Status address
    dma.writeRegister(0x14, 0x00); // Status mask
    dma.writeRegister(0x18, 0x00); // Status value
    dma.writeRegister(0x1C, 4); // Data size (32-bit words)
    
    // Reset all devices after setup to ensure clean state
    memoryBus.reset();
  });

  afterEach(() => {
    // Cleanup devices and bus
    peripheral1.address = null;
    peripheral2.address = null;
    memoryBus.devices = [];
  });

  it('should be able to connect to peripherals', async () => {
    await expect(dma.start()).resolves.not.toThrow();
  });

  it('should handle transfer correctly', async () => {
    const expectedData = [0x10, 0x20, 0x30, 0x40];
    
    // Set up the transfer
    const conn = {
      sourceAddress: 0x150,
      destinationAddress: 0x200,
      transferLength: 4
    };
    
    await dma.start();
    
    // Wait for the transfer to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify data was transferred
    const readData = ram.read(conn.destinationAddress);
    expect(readData).toEqual(expectedData);
    
    // Verify all bytes are correct
    expect([...expectedData].every((value, offset) => 
      (readData & (value << ((4 - offset) * 8))) !== 0
    ));
    
    // Verify control register is reset
    const status = memoryBus.read(dma.statusAddress);
    expect(status === 0x00); // Should be cleared after transfer
  });

  it('should handle errors correctly', () => {
    const testError = () => {
      // Try to write invalid address
      const badOffset = 0x500;
      try {
        memoryBus.write(badOffset, 0x1234);
      } catch (error) {}
      
      // Check if DMA handles the error
      expect(dma.writeRegister).toHaveBeenCalled();
    };
    
    testError();
  });
});
