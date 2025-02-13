#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>
#include "handyarm.h"

// Flash programmer base address (assuming it's mapped here, adjust as needed)
#define FLASH_PROG_BASE (0xE1000000)

// Control register bits
#define FLASH_CTRL_WRITE_ENABLE    (1 << 0)
#define FLASH_CTRL_AUTO_INCREMENT  (1 << 1)


void SystemInit(void) {

}

// Example flash programming functions
void flash_init(void) {
   // Initialize flash programmer with write disabled
   HandyARM_FlashProg(FLASH_PROG_BASE)->control = 0;
}

void flash_enable_write(void) {
   // Enable write and auto-increment
   HandyARM_FlashProg(FLASH_PROG_BASE)->control = FLASH_CTRL_WRITE_ENABLE | FLASH_CTRL_AUTO_INCREMENT;
}

void flash_disable_write(void) {
   // Disable write
   HandyARM_FlashProg(FLASH_PROG_BASE)->control = 0;
}

void flash_erase_page(uint32_t page_number) {
   // Erase a page of flash
   HandyARM_FlashProg(FLASH_PROG_BASE)->erase_page = page_number;
}

void flash_write_word(uint32_t offset, uint32_t value) {
   // Set the offset
   HandyARM_FlashProg(FLASH_PROG_BASE)->offset = offset;
   // Write the value
   HandyARM_FlashProg(FLASH_PROG_BASE)->value = value;
}

// Example usage
int main(void) {
   printf("Flash Programming Example\n");

   // Initialize flash
   flash_init();

   // Enable writing
   flash_enable_write();

   // Erase page 0
//   printf("Erasing page 0...\n");
//   flash_erase_page(0);

   // Write a pattern to flash
   printf("Writing pattern to flash...\n");
   for (uint32_t i = 0x10000; i < 0x10400; i+=4) {
      flash_write_word(i , 0xDEADBEEF + i);
   }

   // Disable writing when done
   flash_disable_write();

   printf("Flash programming complete\n");

// Confirm the write put the correct data at 0x10000 (absolute address in RAM)
   printf("Verifying written data...\n");
   uint8_t *flash_memory = (uint8_t *) 0x10000; // Pointer to the flash memory region
   int errors = 0;

   for (uint32_t i = 0; i < 400; i+=4) {
      uint32_t expected = 0xDEADBEEF + i + 0x10000;
      uint32_t actual = *((uint32_t * )(flash_memory + i));

      if (actual != expected) {
         printf("Error at offset 0x%lx: expected 0x%lx, got 0x%lx\n", i, expected, actual);
         errors++;
      }
   }

   if (errors == 0) {
      printf("Data verification successful: All values match expected patterns.\n");
   } else {
      printf("Data verification failed: %d errors found.\n", errors);
   }

   while(1){
      ;//loop forever.
   }

}//
// Created by kaylee on 2/13/25.
//
