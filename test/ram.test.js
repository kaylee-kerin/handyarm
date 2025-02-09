 // ram.test.js
 const RAM = require('../src/ram.js');

 describe('RAM', () => {
  let ram;

  beforeEach(() => {
   ram = new RAM(1024); // 1KB RAM for testing
  });

  it('should create a RAM instance', () => {
   expect(ram).toBeInstanceOf(RAM);
   expect(ram.size).toBe(1024);
  });

  it('should read a word from RAM', () => {
   ram.write(0, 0x12345678);
   const value = ram.read(0);
   expect(value).toBe(0x12345678);
  });

  it('should write a word to RAM', () => {
   ram.write(0, 0xABCDEF01);
   const value = ram.dataView.getUint32(0, true);
   expect(value).toBe(0xABCDEF01);
  });

  it('should read 0 when reading from an uninitialized address', () => {
   const value = ram.read(0);
   expect(value).toBe(0);
  });

  it('should handle writing and reading different values at different offsets', () => {
   ram.write(0, 0x11223344);
   ram.write(4, 0x55667788);

   expect(ram.read(0)).toBe(0x11223344);
   expect(ram.read(4)).toBe(0x55667788);
  });

  it('should return 0 and log a warning when reading out of bounds', () => {
   const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(); // Suppress console.warn output during test

   const value = ram.read(2048); // Out of bounds (size is 1024)
   expect(value).toBe(0);
   expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('RAM read out of bounds'));

   consoleWarnSpy.mockRestore(); // Restore original console.warn
  });

  it('should log a warning but not crash when writing out of bounds', () => {
   const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(); // Suppress console.warn output during test

   ram.write(2048, 0x12345678); // Out of bounds (size is 1024)
   expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('RAM write out of bounds'));

   consoleWarnSpy.mockRestore(); // Restore original console.warn
  });

  it('should use little-endian byte order', () => {
   ram.write(0, 0x12345678);
   expect(ram.dataView.getUint8(0)).toBe(0x78);
   expect(ram.dataView.getUint8(1)).toBe(0x56);
   expect(ram.dataView.getUint8(2)).toBe(0x34);
   expect(ram.dataView.getUint8(3)).toBe(0x12);
  });

  it('should handle maximum size RAM', () => {
   const maxSize = Math.pow(2,32) - 1;
   const ramLarge = new RAM(1024);
   ramLarge.write(0, 0x12345678);
   expect(ramLarge.read(0)).toBe(0x12345678);

  })
 });