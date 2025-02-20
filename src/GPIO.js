const { EventEmitter } = require('events');
/** This is the C define that the interface for a simple STM32 Cortex-M0 device
 *
 * typedef struct __attribute__((packed))
 * {
 *    @0   volatile uint32_t low_control_register;//CRL; //CRL is composed of sections of 4 bits, for pins 0-7
 *    @4 volatile uint32_t high_control_register;//CRH; //CRH is the same, but for pins 8-15
 *    @8  volatile uint16_t padding_in;  //You can ignore me.
 *    @10  volatile uint16_t input_data_register;//IDR;
 *    @12  volatile uint16_t padding_out; //You can ignore me.
 *    @14  volatile uint16_t output_data_register;//ODR;
 *    @16  volatile uint32_t BSRR;
 *    @20  volatile uint32_t BRR;
 *    @24  volatile uint32_t LCKR;
 * } GPIO_Type;  //Starts at index 0x00
 *
 * #define CR_MODE_OUTPUT_SPEED_FULL     0b0011
 * #define CR_MODE_OUTPUT_SPEED_MED      0b0001
 * #define CR_MODE_OUTPUT_SPEED_SLOW     0b0010
 * #define CR_TYPE_OUTPUT_OPENDRAIN      0b0100
 * #define CR_TYPE_OUTPUT_PUSHPULL       0b0000
 *
 * #define CR_MODE_INPUT_ANALOG          0b0000
 * #define CR_MODE_INPUT_FLOAT           0b0100
 * #define CR_MODE_INPUT_PULLED          0b1000
 */
class GPIO extends  EventEmitter {
    constructor() {
        super();
        this._externalDrive = [0,0,0,0,0,0,0,0]; //Floating.
        this._output= 0;
        this._idr = 0;
    }

    /**putting data into a GPIO should emulate a digital wire's influence on the GPIO (based upon the GPIO config)
     * For example, If the GPIO is configured as a floating input, the value is going to be...somewhat, randomized, but likely low (0).
     * But, if we have pull-up connected, a floating input will drive a 1 value.
     * Pull-down drives a zero.
     *
     * And we need to fill in all the other options for a pulled high, and pulled low pin.
     * Ultimately, it's a truth table between the configurations and the set value.
     * For the value, we'll use the conventions used in Dynamic formulas.
     * -1 (pulled to ground)
     * 0 (floating)
     * 1 (pulled to Vcc)
     *
     *   /--- External Reference.
     *  |
     *  ^ |-1 | 0 | 1 | >---- GPIO Pin Config (Combo of pull up, pull down, and actual I/O value.
     * -1 | 0 | 0 | 0 |         0 ( GPIO Pin reads 0 )
     *  0 | 0 | X | 1 |         1 ( GPIO Pin reads 1 )
     *  1 | 1 | 1 | 1 |         X ( GPIO Pin reads "noise" )
     */
    setExternalDrive(pin,value) {
        //TODO: confirm value is one of (-1,0,1)
        this._externalDrive[pin] = value;

        if(value < 0){
            this._idr&= ~(1 << pin+16);
        }else if(value === 0){
            //floating, drive nothing (for now, should we do more?)
            //this._idr&= ~(1 << pin);
        }else{
            this._idr|= (1 << pin+16);
        }
    }



    //For Reads, we need to take the
    read(address) {
        switch(address) {
            case 8: // includes the input data register
                return this._idr;
            case 0: //low control register
            case 4: //high control register
            case 10:
            case 16:
            case 20:
            case 24:
                return 0;
            default:
                //TODO: calculate the input_data_register based upon the setExternalDrive value, and return it for 0x10
                throw new Error(`Invalid read at address: 0x${address.toString(16)}`);
        }
    }

    write(address, value) {
        //When a write happens, it means some part of the GPIO config was updated.
        //Figure out which part, merge it with the external drive, and send the data event.
        switch(address) {
            case 0: //low control register
                break;
            case 4: //high control register
                break;
            case 8: //input data register //Not usually writable...
                break;
            case 12: //output data register
                break;
            case 16: //BSRR (Set/Reset Register)
            case 20: //BRR (Reset Register)

                //Low 16 bits are for setting
                //High 16 bits are for resetting
                //This GPIO peripheral needs to keep state itself, since the results are incremental with the writes.
                let set_val = (value & 0xFFFF) >>> 0;
                let reset_val = value >>> 16;

                if(address == 16){ //BRR and BSRR are inverts of each other, but otherwise are the same.
                    set_val = ~set_val >>> 0;
                    reset_val = ~reset_val >>> 0;
                }
                this._output = this._output | set_val;
                this._output = this._output & ~reset_val;

//                console.log('GPIO Updated',address,value.toString(16),set_val.toString(16),reset_val.toString(16),this._output);
                this.emit('data', this._output);

                break;
            case 24: //Lock Register
                break;

        }

        //emit the right calculated driven value based upon setExternalDrive, and the output_data_register
        //this.emit('data', {pin: address, value} ); // Emit a 'data' event, which should include ALL pins on this GPIO (Output Value only)
    }
}

module.exports = {GPIO};
