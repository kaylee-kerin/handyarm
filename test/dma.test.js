const { Bus } = require('../src/bus');
const { RAM } = require('../src/ram');
const { DMA } = require('../src/dma');

// Setup mock bus and RAMs with different sizes to demonstrate alignment
const bus = new Bus();
const srcRam = new RAM(128);
const destRam = new RAM(256);

describe('DMA Transfer Test', () => {
  // Test valid transfer of 4-byte chunks
  it('Should perform 4-byte transfer correctly', async () => {
    // Test data - 3 elements (each 4 bytes)
    const testData = Array.from({ length: 3 }, (_, i) => i);
    
    // Setup DMA configuration for 4-byte transfers
    const dmaConfig = {
      sourceAddress: 0,
      destinationAddress: 0,
      transferLength: 12, // 3 elements * 4 bytes each
      alignment: 4, // Ensure 4-byte alignment
      controlRegister: 1 << 1, // Enable DMA (bit 1)
    };

    const transferComplete = new Promise(resolve => {
      setTimeout(resolve, 1000); // Simulate transfer completion after 1ms
    });

    try {
      // Start the transfer
      srcRam.write(0, testData);
      destRam.write(0, 0);
      
      await bus.runDMA(dmaConfig, srcRam, destRam);
      
      // Verify all data was copied correctly
      for (let i = 0; i < testData.length; i++) {
        expect(destRam.read(i * 4)).toBe(testData[i]);
      }
    } catch (error) {
      console.error('Transfer failed:', error.message);
      fail(`Transfer failed: ${error.message}`);
    } finally {
      transferComplete.resolve();
    }
  });

  // Test invalid parameters
  it('Should handle invalid DMA configuration', () => {
    const badConfig = {
      sourceAddress: 0,
      destinationAddress: 0,
      transferLength: -1,
      alignment: 4,
      controlRegister: 1 << 1,
    };
    
    expect(() => {
      bus.runDMA(badConfig, srcRam, destRam);
    }).toThrow();
  });
});
