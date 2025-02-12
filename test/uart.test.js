 // uart.test.js
 const UART = require('../src/uart');

 describe('UART', () => {
  let uart;

  beforeEach(() => {
   uart = new UART();
  });

  it('should create a UART instance', () => {
   expect(uart).toBeInstanceOf(UART);
  });

  it('should receive data and store it in the rxData register', () => {
   uart.receive(0x41); // 'A'
   expect(uart.rxData).toBe(0x41);
  });

  it('should read the rxData register', () => {
   uart.receive(0x42); // 'B'
   expect(uart.read(0)).toBe(0x42);
  });

  it('should write to the txData register and call the onTransmit callback', () => {
   const transmitCallback = jest.fn();
   uart.onTransmit = transmitCallback;

   uart.write(0, 0x43); // 'C'

   expect(uart.txData).toBe(0x43);
   expect(transmitCallback).toHaveBeenCalledWith(0x43);
  });

  it('should handle no onTransmit callback gracefully', () => {
   uart.write(0, 0x44); // 'D'
   expect(uart.txData).toBe(0x44); //Should still write txData
  });

  it('should log a warning when reading from an invalid offset', () => {
   const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

   uart.read(1); // Invalid offset

   expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('UART read from invalid offset'));

   consoleWarnSpy.mockRestore();
  });

  it('should log a warning when writing to an invalid offset', () => {
   const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

   uart.write(1, 0x12345678); // Invalid offset

   expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('UART write to invalid offset'));

   consoleWarnSpy.mockRestore();
  });

  it('should only keep the lower 8 bits of received data', () => {
   uart.receive(0x12345678);
   expect(uart.rxData).toBe(0x78);
  });

  it('should only keep the lower 8 bits of transmitted data', () => {
   const transmitCallback = jest.fn();
   uart.onTransmit = transmitCallback;

   uart.write(0, 0x12345678);

   expect(uart.txData).toBe(0x78);
   expect(transmitCallback).toHaveBeenCalledWith(0x78);
  });
 });