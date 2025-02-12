//
// Created by kaylee on 2/12/25.
//

#ifndef HANDYARM_HANDYARM_H
#define HANDYARM_HANDYARM_H


/** Transmit Register map */
typedef struct HandyARM_Transmit_S{
   volatile void *start_addr;
   volatile uint32_t length;  //The write to this register initiates the transfer
                               //IMMEDIATELY (and completes before the write returns)
} __attribute((packed)) HandyARM_Transmit;


/** Receive Register map */
typedef struct HandyARM_Receive_S {
   volatile uint32_t start_offset;
   volatile uint32_t end_offset;
   volatile uint32_t length;
   volatile uint32_t padding[(0x100-12)/4]; //12 is the number of bytes the variables above this take up.
   volatile uint8_t buffer[]; //This is at address 0x100, pad it out above to put it there.
} __attribute((packed)) HandyARM_Receive;

#define HandyARM_R(addr) ((HandyARM_Receive *)((void *)addr))
#define HandyARM_T(addr) ((HandyARM_Transmit *)((void *)addr))

#endif //HANDYARM_HANDYARM_H
