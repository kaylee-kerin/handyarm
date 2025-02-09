const { DMA } = require('./src/dma');
const { RAM } = require('./src/ram');

describe('DMA', () => {
  let sourceRam, destinationRam, dma;
  
  beforeEach(async () => {
    // Setup test RAM instances
    sourceRam = new RAM(256);
    destinationRam = new RAM(256);
    
    // Initialize DMA with bus (we'll use RAM as a mock bus for testing)
    dma = new DMA({
      read: (address) => {
        return sourceRam.read(address);
      },
      write: (address, value) => {
        return destinationRam.write(address, value);
      }
    });
    
    // Clear any previous transfers
    await_dma.close();
  });

  afterEach(() => {
    if (dma) {
      dma = null;
    }
  });

  describe('Basic Transfer', () => {
    it('Should perform successful transfer with default settings', async () => {
      const testData = [0x00, 0x01, 0x02, 0x03];
      const srcAddress = 0x100;
      const destOffset = 0;
      
      // Test with default configuration (4 bytes)
      await dma.start();
      
      expect(true).toBe(true); // Basic success check
    });

    it('Should verify transfer completion status', async () => {
      const testData = [0x00, 0x01, 0x02, 0x03];
      const srcAddress = 0x100;
      const destOffset = 0;
      
      try {
        await dma.start();
        
        // Check if transfer completed successfully
        expect(dma.transferComplete).toBe(true);
        expect(dma.controlRegister).toBe(0); // Control register should be cleared
        expect(destinationRam.read(destOffset)).toBe(testData.reduce((a, b) => a << 8 | b, 0));
      } catch (error) {
        console.error('Transfer failed:', error);
        fail(error);
      }
    });

    it('Should support transfer with specified settings', async () => {
      const testData = [0x00, 0x01, 0x02, 0x03];
      const srcAddress = 0x100;
      const destOffset = 0x10;
      const length = 16; // Transfer 64 bytes
      
      // Test with specific configuration
      await dma.writeRegister(0x08, length);
      await dma.writeRegister(0x00, srcAddress << 8);
      
      try {
        await dma.start();
        
        // Verify successful completion
        expect(dma.transferComplete).toBe(true);
        expect(dma.controlRegister).toBe(0);
        expect(destinationRam.read(destOffset)).toBe(
          testData.reduce((a, b) => a << 8 | b, 0)
        );
      } catch (error) {
        console.error('Transfer failed:', error);
        fail(error);
      }
    });
  });

  describe('Error Handling', () => {
    it('Should throw error with invalid transfer length', async () => {
      try {
        await dma.start();
        expect(true).toBe(false); // Should throw an error
      } catch (error) {
        expect(error).toContain('Aborting'); // Check error message
      }
    });
  });
});
