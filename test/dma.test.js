const DMA = require('../src/dma');

describe('DMA', () => {
  // Mock up some peripheral devices we'll work with
  const Peripheral = class {
    constructor(addr) {
      this.address = addr;
    }
    
    read() {
      return 0x1234; // Simulate some data
    }
    
    write(value, offset) {
      console.log(`Peripheral writing: 0x${value.toString(16)} to ${offset}`);
    }
  };

  let busMock;
  let peripheral1, peripheral2;
  let dma;

  beforeEach(() => {
    // Reset DMA for each test
    busMock = new (class BusMock {})();
    peripheral1 = new Peripheral(0x100);
    peripheral2 = new Peripheral(0x200);
    
    // Setup the DMA with our mock bus
    dma = new DMA(busMock);
    
    // Connect the DMA to peripherals
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
    dma.writeRegister(0x00, 0x150); // Source address
    dma.writeRegister(0x04, 0x100); // Destination address
    dma.writeRegister(0x08, conn1.transferLength); // Transfer length
    dma.writeRegister(0x0C, 0x01); // Control register (enable DMA)
    dma.writeRegister(0x10, 0x20); // Status address
    dma.writeRegister(0x14, 0x00); // Status mask
    dma.writeRegister(0x18, 0x00); // Status value
    dma.writeRegister(0x1C, 4); // Data size (32-bit words)
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
    const readData = busMock.read(conn.destinationAddress);
    
    expect(readData).toEqual([0x10, 0x20, 0x30, 0x40]);
    
    expect([...expectedData].every(value => 
      readData & (value << ((4 - offset) * 8)) !== 0
    ));
    
    // Verify control register is reset
    const status = busMock.read(dma.statusAddress);
    expect(status === 0x00); // Should be cleared after transfer
  });

  it('should handle errors correctly', () => {
    const testError = () => {
      // Try to write invalid address
      const badOffset = 0x500;
      try {
        busMock.write(badOffset, 0x1234);
      } catch (error) {}
      
      // Check if DMA handles the error
      expect(dma.writeRegister).toHaveBeenCalled();
    };
    
    testError();
  });
});
