const { Bus } = require('../src/bus');
const { RAM } = require('../src/ram');
const { DMA } = require('../src/dma');

// Setup mock bus and RAMs with different sizes to demonstrate alignment
const bus = new Bus();
const srcRam = new RAM(128);
const destRam = new RAM(256);

describe('DMA Transfer Test', () => {
  it('Should perform aligned 4-byte transfer correctly', async () => {
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
      
      // Verify all data was copied correctly with proper alignment
      for (let i = 0; i < testData.length; i++) {
        const address = i * 4;
        expect(destRam.read(address) >> ((3 - i) * 4)).toBe(testData[i]);
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

  // Test aligned transfer completion
  it('Should properly complete DMA transfers', (done) => {
    const testData = [0x1234, 0x5678, 0x90AB];
    
    const dmaConfig = {
      sourceAddress: 0,
      destinationAddress: 0,
      transferLength: 12,
      alignment: 4,
      controlRegister: 1 << 1,
    };

    bus.runDMA(dmaConfig, srcRam, destRam, () => {
      try {
        for (let i = 0; i < testData.length; i++) {
          const address = i * 4;
          expect(destRam.read(address) >> ((3 - i) * 4)).toBe(testData[i]);
        }
        done();
      } catch (error) {
        fail(`Transfer failed: ${error.message}`);
        done();
      }
    });
  });
});
