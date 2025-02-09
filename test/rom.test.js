 // rom.test.js (modified)
 const ROM = require('../src/rom.js');

 describe('ROM', () => {
  it('should create a ROM instance with the provided data', () => {
    const data = [0x12345678, 0xABCDEF01, 0x90123456];
    const rom = new ROM(data);
    
    expect(rom).toBeInstanceOf(ROM);
    expect(rom.size).toBe(data.length * 4); // Size in bytes
  });

  describe('Error Handling', () => {
    it('should throw error for negative offset', () => {
      const data = [0x12345678, 0xABCDEF01];
      const rom = new ROM(data);
      
      expect(() => rom.read(-1)).toThrow();
    });

    it('should throw error for out of bounds read', () => {
      const data = [0x12345678];
      const rom = new ROM(data);
      
      expect(() => rom.read(8)).toThrow();
    });

    it('should throw error for unaligned address', () => {
      const data = [0x12345678, 0xABCDEF01];
      const rom = new ROM(data);
      
      expect(() => rom.read(1)).toThrow();
    });

    it('should throw error on write attempt', () => {
      const data = [0x12345678];
      const rom = new ROM(data);
      
      expect(() => rom.write(0, 0x1234)).toThrow();
    });

    it('should handle mixed valid and invalid operations', () => {
      const data = [0x12345678, 0xABCDEF01];
      const rom = new ROM(data);
      
      // Should throw for read at invalid address
      expect(() => rom.read(1)).toThrow();
      
      // Should pass for read at valid offset
      expect(rom.read(0)).toBe(0x12345678);
    });
  });


 });
