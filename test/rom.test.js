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


 });
