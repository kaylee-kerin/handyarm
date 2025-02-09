# ARM Thumb Emulator for Browser-Based Computer Systems

A JavaScript-based computer emulator focusing on ARM Thumb instruction set implementation. This project provides core components (CPU, RAM, ROM, DMA, UART) for building hardware emulators in the browser.

## Table of Contents
- [Introduction](#introduction)
- [Architecture Overview](#architecture-overview)

## Introduction

This emulator provides a foundation for building ARM Thumb-based computer systems in the browser. The core components are designed to work together via a common bus interface, allowing flexible hardware configurations.

Key features:
- Bus-based architecture connects all peripherals and CPUs
- Implements RAM and ROM storage
- Includes DMA controller for memory management
- Supports serial communication (UART)
- Designed for ARM Thumb instruction set emulation

## Architecture Overview

The system is built around several core components:

### 1. The Bus
- Handles address decoding and device discovery
- Routes read/write operations to the appropriate peripherals
- Core.js/src/bus.js

### 2. Memory Components
- RAM: Dynamic memory with bounds checking (src/ram.js)
- ROM: Read-only storage with validation (src/rom.js)

### 3. DMA Controller
- Manages block transfers between devices and memory
- src/dma.js

### 4. Serial Communication
- UART implementation with receive/transmit callbacks
- src/uart.js

