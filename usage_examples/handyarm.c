#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>
#include "handyarm.h"

//Set the address(s) used for the data channels (Can be multiple, if the host mapped multiple)
#define CONSOLE_DT ((0xE0000000))  //Transmit Channel (Sending data from us to the host)
#define CONSOLE_DR ((0xE0001000))  //Receive Channel  (Sending data from host to us)

int _read(int file, char *ptr, int len){
//  (void)file;
  uint32_t DataIdx = 0;

  volatile uint8_t *readbuffer = HandyARM_R(CONSOLE_DR)->buffer;
  while(HandyARM_R(CONSOLE_DR)->start_offset != HandyARM_R(CONSOLE_DR)->end_offset){
    ptr[DataIdx] = readbuffer[HandyARM_R(CONSOLE_DR)->start_offset];
    (HandyARM_R(CONSOLE_DR))->start_offset=1; //increment the start position, now that we consumed it.

    DataIdx++;
    if(DataIdx == len){
       break;
    }
  }
  
  return DataIdx;
}

int _write(int file, char *ptr, int len){
//  (void)file;

  HandyARM_T(CONSOLE_DT)->start_addr = ptr;
  HandyARM_T(CONSOLE_DT)->length = len; //The transfer is automatically performed by the host when we write the length.
                            //This allows for us to keep the "start" the same if we wanted to.
                            //but for this system call, we'll just do it via a "zero copy" method, 
                            //and let the host handle reading it from the bus as necessary

  return len;
}
