 // rom.test.js (modified)
 const ROM = require('../src/rom.js');

 describe('ROM', () => {
  it('should create a ROM instance with the provided data', () => {
   const data = [0x12345678, 0xABCDEF01, 0x90123456];
   const rom = new ROM(data);

   expect(rom).toBeInstanceOf(ROM);
   expect(rom.size).toBe(data.length * 4); // Size in bytes
  });

  it('should read data from the ROM at a valid offset', () => {
   const data = [0x12345678, 0xABCDEF01, 0x90123456];
   const rom = new ROM(data);

   expect(rom.read(0)).toBe(0x12345678);
   expect(rom.read(4)).toBe(0xABCDEF01);
   expect(rom.read(8)).toBe(0x90123456);
  });

  it('should return 0 and log a warning when reading out of bounds', () => {
   const data = [0x12345678];
   const rom = new ROM(data);
   const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

   const value = rom.read(1024); // Out of bounds
   expect(value).toBe(0);
   expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('ROM read out of bounds'));

   consoleWarnSpy.mockRestore();
  });

  it('should log a warning and return 0 when reading from an unaligned address', () => {
   const data = [0x12345678];
   const rom = new ROM(data);
   const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

   const value = rom.read(1); // Unaligned address
   expect(value).toBe(0);
   expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('ROM read from unaligned address'));

   consoleWarnSpy.mockRestore();
  });

  it('should log a warning when writing to the ROM (ROM is read-only)', () => {
   const data = [0x12345678];
   const rom = new ROM(data);
   const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

   rom.write(0, 0xABCDEF01);

   expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Attempted write to ROM'));

   consoleWarnSpy.mockRestore();
  });

  it('should handle an empty ROM', () => {
   const data = [];
   const rom = new ROM(data);
   expect(rom.size).toBe(0);
   expect(rom.read(0)).toBe(undefined);
  });
 });