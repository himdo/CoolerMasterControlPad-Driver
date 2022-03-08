import * as usb from 'usb';

const VID = 0x2516
// const vid = 9610
// const pid = 4103
const PID = 0x007b
// const COMMAND_ENDPOINT = 0x03
// const INTERRUPT_ENDPOINT = 0x81
// const MAX_PACKET_SIZE = 8
// const INTERFACE_NUMBER = 0
// const MAX_PACKET_SIZE = 64
// ===================
const COMMAND_ENDPOINT = 0x04
const INTERRUPT_ENDPOINT = 0x83
const INTERFACE_NUMBER = 1
const MAX_PACKET_SIZE = 64
// ===================
// const COMMAND_ENDPOINT = undefined // this only has the one end point
// const INTERRUPT_ENDPOINT = 0x82
// const INTERFACE_NUMBER = 2
// const MAX_PACKET_SIZE = 64

const TIMEOUT = 1000
export const LED_CYCLE_ENUM = {
    'static': 0, // done
    'rainbow wave': 1, //done
    'crosshair': 2, // Done with fix to out 1
    'reactive fade': 3, // Done with fix to out 1
    'custom': 4, // done, with fix to out 1 and second send
    'stars': 5, // done with fix to out 1
    'snowing': 6, // done with fix to out 1
    'color cycle': 7, //done
    'breathing': 8, //done
    'reactive punch': 9, // Not working IDK why
    'circle spectrum': 10, //done
    'reactive tornado': 11, //done
    'water ripple': 12, // done with fix to out 1
    'turn off': 13, //done
} 

const SIMPLE_LED_CYCLE = [
    LED_CYCLE_ENUM['static'], 
    LED_CYCLE_ENUM['rainbow wave'], 
    LED_CYCLE_ENUM['color cycle'], 
    LED_CYCLE_ENUM['breathing'], 
    LED_CYCLE_ENUM['circle spectrum'],
    LED_CYCLE_ENUM['reactive tornado'], 
    LED_CYCLE_ENUM['turn off']
]

export class CMCp {
    device;
    iFace;
    commandEp;
    interruptEp;
    iFace;

    constructor() {
        this.device = usb.findByIds(VID, PID)
        if (!this.device) {
            throw new Error("CMCp Device not found")
        }

        this.device.open()
        this.iFace = this.device.interfaces[INTERFACE_NUMBER]
        
        if (this.iFace.isKernelDriverActive()) {
            this.hasDetachedKernelDriver = true;
            this.iFace.detachKernelDriver();
        }
        this.iFace.claim();
        this.commandEp = this.iFace.endpoints.find(e => e.address === COMMAND_ENDPOINT);
        this.interruptEp = this.iFace.endpoints.find(e => e.address === INTERRUPT_ENDPOINT);
    }

    async commandTransfer(data) {
        return new Promise((resolve, reject) => {
            const cb = (err, data, length) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data.slice(0, length));
            };

            const transfer = this.commandEp.makeTransfer(TIMEOUT, cb);
            transfer.submit(data, cb);
        });
    }
    
    async interruptTransfer(data) {
        return new Promise((resolve, reject) => {
          const cb = (err, data, length) => {
            if (err) {
                return reject(err);
            }
            return resolve(data.slice(0, length));
          };
    
          const transfer = this.interruptEp.makeTransfer(TIMEOUT, cb);
          transfer.submit(data, cb);
        });
    }

    simpleLedMode(mode, transferBuffer, red, green, blue, brightness, ledSpeed) {
        if (mode === LED_CYCLE_ENUM['static']) {
            transferBuffer[9]  = 0x01 // not sure but if changed no lights
            transferBuffer[11] = 0xc1
            transferBuffer[15] = 0xda // not sure but can change
        } else if (mode === LED_CYCLE_ENUM['rainbow wave']) {
            transferBuffer[9]  = 0x32
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x07
            transferBuffer[25] = 0x04
            transferBuffer[26] = 0x08
        } else if (mode === LED_CYCLE_ENUM['color cycle']) {
            transferBuffer[9]  = 0x31
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x08
        } else if (mode === LED_CYCLE_ENUM['breathing']) { 
            transferBuffer[9]  = 0x30
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x0c
            transferBuffer[20] = 0x01 // changes breathing patterns and colors // 00 color cycles 01 breaths 02 breaths and color cycles in strange pattern 03 breaths and color cycles on breadth
        } else if (mode === LED_CYCLE_ENUM['circle spectrum']) {
            transferBuffer[9]  = 0x34
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x04
        } else if (mode === LED_CYCLE_ENUM['reactive tornado']) {
            transferBuffer[9]  = 0x83
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x04
            transferBuffer[25] = 0xff // these determine patterns somehow
            // transferBuffer[26] = 0xff // these determine patterns somehow
            transferBuffer[27] = 0x10 // these determine patterns somehow

        } else if (mode === LED_CYCLE_ENUM['turn off']) {
            transferBuffer[8]  = 0x01
            transferBuffer[11] = 0xc1
        }

        transferBuffer[16] = red // red
        transferBuffer[17] = green // green
        transferBuffer[18] = blue // blue
        transferBuffer[19] = brightness // 0xff // this is the brightness bit ff is full bright
        transferBuffer[22] = ledSpeed
        
        return transferBuffer
    }

    complexLedMode(mode, transferBuffer, red, green, blue, brightness, ledSpeed) {
        if (mode === LED_CYCLE_ENUM['crosshair']) { // done with fix
            transferBuffer[4]  = 0x0c
            transferBuffer[6]  = 0x0c
            transferBuffer[8]  = 0x03
            transferBuffer[12] = 0x07
            transferBuffer[14] = 0x01
            transferBuffer[17] = 0x01
            transferBuffer[19] = 0xc1
            transferBuffer[27] = 0xff
            transferBuffer[33] = 0x80
            transferBuffer[35] = 0x80
            transferBuffer[36] = 0x0b
            transferBuffer[37] = 0x10
            transferBuffer[40] = red // red
            transferBuffer[41] = green // green
            transferBuffer[42] = blue // blue
            transferBuffer[43] = brightness // brightness
            transferBuffer[46] = ledSpeed//0x02
            transferBuffer[47] = 0x01 // light reflex? 0x01 default
            transferBuffer[48] = 0x03//0x03 // spread size 0 no spread 01 vertical only 02 horizontal only 3 both
            transferBuffer[52] = 0xff // nothing?
            transferBuffer[53] = 0xff // nothing?
            transferBuffer[54] = 0xff
            transferBuffer[55] = 0xff
            transferBuffer[56] = 0xff
            transferBuffer[57] = 0xff
            transferBuffer[58] = 0xff // controls if the reaches 9 14 19 24 5 10 15 and 20
            transferBuffer[59] = 0xff
        } else if (mode === LED_CYCLE_ENUM['reactive fade']) { // done with fix
            // could not find other initial colors besides blue
            transferBuffer[4]  = 0x0c
            transferBuffer[6]  = 0x0c
            transferBuffer[8]  = 0x03
            transferBuffer[12] = 0x07
            transferBuffer[14] = 0x01
            transferBuffer[17] = 0x01
            transferBuffer[19] = 0xc1
            transferBuffer[26] = 0xc6
            transferBuffer[27] = 0xff // initial blue
            transferBuffer[33] = 0x80
            transferBuffer[35] = 0x80
            transferBuffer[36] = 0x0b
            transferBuffer[37] = 0x10
            transferBuffer[40] = red // red
            transferBuffer[41] = green // green
            transferBuffer[42] = blue // blue
            transferBuffer[43] = brightness
            transferBuffer[46] = ledSpeed //0x02 // led speed
            transferBuffer[52] = 0xff
            transferBuffer[53] = 0xff
            transferBuffer[54] = 0xff
            transferBuffer[55] = 0xff
            transferBuffer[56] = 0xff
            transferBuffer[57] = 0xff
            transferBuffer[58] = 0xff
            transferBuffer[59] = 0xff
        } else if (mode === LED_CYCLE_ENUM['stars']) { // done with fix
            transferBuffer[4]  = 0x0d
            transferBuffer[6]  = 0x0d
            transferBuffer[8]  = 0x03
            transferBuffer[12] = 0x07
            transferBuffer[14] = 0x01
            transferBuffer[17] = 0x01
            transferBuffer[19] = 0xc1
            transferBuffer[27] = 0xff
            transferBuffer[33] = 0x40
            transferBuffer[35] = 0x80
            transferBuffer[36] = 0x08
            transferBuffer[37] = 0x10
            transferBuffer[40] = red
            transferBuffer[41] = green
            transferBuffer[42] = blue
            transferBuffer[43] = brightness
            transferBuffer[46] = ledSpeed // 0x01
            transferBuffer[48] = 0x01
            transferBuffer[49] = 0x10
            transferBuffer[50] = 0x08
            transferBuffer[51] = 0x01
            transferBuffer[52] = 0x10
            transferBuffer[57] = 0xff
            transferBuffer[58] = 0xff
            transferBuffer[59] = 0xff
            transferBuffer[60] = 0xff
            transferBuffer[61] = 0xff
            transferBuffer[62] = 0xff
            transferBuffer[63] = 0xff
        } else if (mode === LED_CYCLE_ENUM['snowing']) { // done with fix
            transferBuffer[4]  = 0x0d
            transferBuffer[6]  = 0x0d
            transferBuffer[8]  = 0x03
            transferBuffer[12] = 0x07
            transferBuffer[14] = 0x01
            transferBuffer[17] = 0x01
            transferBuffer[19] = 0xc1
            transferBuffer[27] = 0xff
            transferBuffer[32] = 0x81
            transferBuffer[33] = 0x40
            transferBuffer[35] = 0x80
            transferBuffer[36] = 0x05
            transferBuffer[37] = 0x10
            transferBuffer[40] = red
            transferBuffer[41] = green
            transferBuffer[42] = blue
            transferBuffer[43] = brightness
            transferBuffer[46] = ledSpeed // 0x03
            transferBuffer[48] = 0x30
            transferBuffer[49] = 0xff
            transferBuffer[50] = 0x10
            transferBuffer[51] = 0x10
            transferBuffer[52] = 0x01
            transferBuffer[53] = 0x40
            transferBuffer[56] = 0xff
            transferBuffer[57] = 0xff
            transferBuffer[58] = 0xff
            transferBuffer[59] = 0xff
            transferBuffer[60] = 0xff
            transferBuffer[61] = 0xff
            transferBuffer[62] = 0xff
            transferBuffer[63] = 0xff
        } else if (mode === LED_CYCLE_ENUM['reactive punch']) { // Done
            transferBuffer[0]  = 0x56
            transferBuffer[1]  = 0x83
            transferBuffer[4]  = 0x0b
            transferBuffer[6]  = 0x0b
            transferBuffer[8]  = 0x03
            transferBuffer[12] = 0x07
            transferBuffer[14] = 0x01
            transferBuffer[17] = 0x01
            transferBuffer[19] = 0xc1
            transferBuffer[27] = 0xff
            transferBuffer[32] = 0x28
            transferBuffer[33] = 0x80
            transferBuffer[35] = 0x80
            transferBuffer[36] = 0x07
            transferBuffer[37] = 0x10
            transferBuffer[40] = red
            transferBuffer[41] = green
            transferBuffer[42] = blue
            transferBuffer[43] = brightness
            transferBuffer[46] = ledSpeed//0x01
            transferBuffer[48] = 0xff
            transferBuffer[49] = 0xff
            transferBuffer[50] = 0xff
            transferBuffer[51] = 0xff
            transferBuffer[52] = 0xff
            transferBuffer[53] = 0xff
            transferBuffer[54] = 0xff
            transferBuffer[55] = 0xff
        } else if (mode === LED_CYCLE_ENUM['water ripple']) { // Done with fix
            transferBuffer[4]  = 0x0c
            transferBuffer[6]  = 0x0c
            transferBuffer[8]  = 0x03
            transferBuffer[12] = 0x07
            transferBuffer[14] = 0x01
            transferBuffer[17] = 0x01
            transferBuffer[19] = 0xc1
            transferBuffer[27] = 0xff
            transferBuffer[32] = 0x01
            transferBuffer[33] = 0x82
            transferBuffer[35] = 0x80
            transferBuffer[36] = 0x0c
            transferBuffer[37] = 0x10
            transferBuffer[40] = red
            transferBuffer[41] = green
            transferBuffer[42] = blue
            transferBuffer[43] = brightness
            transferBuffer[46] = ledSpeed//0x06
            transferBuffer[49] = 0x90
            transferBuffer[50] = 0x14
            transferBuffer[51] = 0x20
            transferBuffer[52] = 0xff
            transferBuffer[53] = 0xff
            transferBuffer[54] = 0xff
            transferBuffer[55] = 0xff
            transferBuffer[56] = 0xff
            transferBuffer[57] = 0xff
            transferBuffer[58] = 0xff
            transferBuffer[59] = 0xff
        }

        return transferBuffer
    }

    async customLedMode (transferBuffer) {
        transferBuffer[8]  = 0x80
        transferBuffer[9]  = 0x01
        transferBuffer[12] = 0xff
        transferBuffer[18] = 0xff
        transferBuffer[19] = 0xff
        transferBuffer[24] = 0x00 // 1 red
        transferBuffer[25] = 0xff // 1 green
        transferBuffer[26] = 0x00 // 1 blue
        transferBuffer[27] = 0x00 // 6 red
        transferBuffer[28] = 0x00 // 6 green
        transferBuffer[29] = 0xff // 6 blue
        transferBuffer[30] = 0x00 // 11 red
        transferBuffer[31] = 0x00 // 11 green
        transferBuffer[32] = 0xff // 11 blue
        transferBuffer[33] = 0xff // 16 r
        transferBuffer[34] = 0xff // 16 g
        transferBuffer[35] = 0xff // 16 b
        transferBuffer[36] = 0xff // 21 r
        transferBuffer[37] = 0xff // 21 g
        transferBuffer[38] = 0xff // 21 b
        transferBuffer[39] = 0xff // 2 r
        transferBuffer[40] = 0xff // 2 g
        transferBuffer[41] = 0xff // 2 b
        transferBuffer[42] = 0xff // 7 r
        transferBuffer[43] = 0xff // 7 g
        transferBuffer[44] = 0xff // 7 b
        transferBuffer[45] = 0xff // 12 r
        transferBuffer[46] = 0xff // 12 g
        transferBuffer[47] = 0xff // 12 b
        transferBuffer[48] = 0xff // 17 r
        transferBuffer[49] = 0xff // 17 g
        transferBuffer[50] = 0xff // 17 b
        transferBuffer[51] = 0xff // 22 r
        transferBuffer[52] = 0xff // 22 g
        transferBuffer[53] = 0xff // 22 b

        transferBuffer[54] = 0xff // 3 r
        transferBuffer[55] = 0xff // 3 g
        transferBuffer[56] = 0xff // 3 b
        transferBuffer[57] = 0xff // 8 r
        transferBuffer[58] = 0xff // 8 g
        transferBuffer[59] = 0xff // 8 b
        transferBuffer[60] = 0xff // 13 r
        transferBuffer[61] = 0xff // 13 g
        transferBuffer[62] = 0xff // 13 b
        transferBuffer[63] = 0x00 // 18 r


        
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(Buffer.alloc(MAX_PACKET_SIZE));
        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)

        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x83
        transferBuffer[2] = 0x01
        transferBuffer[4] = 0x00 // 18 g
        transferBuffer[5] = 0xff // 18 b

        transferBuffer[6] = 0xff // 23 r
        transferBuffer[7] = 0xff // 23 g
        transferBuffer[8] = 0xff // 23 b
        transferBuffer[9] = 0xff // 4 r
        transferBuffer[10] = 0xff // 4 g
        transferBuffer[11] = 0xff // 4 b
        transferBuffer[12] = 0xff // 9 r
        transferBuffer[13] = 0xff // 9 g
        transferBuffer[14] = 0xff // 9 b
        transferBuffer[15] = 0xff // 14 r
        transferBuffer[16] = 0xff // 14 g
        transferBuffer[17] = 0xff // 14 b
        transferBuffer[18] = 0xff // 19 r
        transferBuffer[19] = 0xff // 19 g
        transferBuffer[20] = 0xff // 19 b
        transferBuffer[21] = 0xff // 24 r
        transferBuffer[22] = 0xff // 24 g
        transferBuffer[23] = 0xff // 24 b
        transferBuffer[24] = 0xff // 5 r
        transferBuffer[25] = 0xff // 5 g
        transferBuffer[26] = 0xff // 5 b
        transferBuffer[27] = 0xff // 10 R
        transferBuffer[28] = 0xff // 10 G
        transferBuffer[29] = 0xff // 10 B
        transferBuffer[30] = 0xff // 15 r
        transferBuffer[31] = 0xff // 15 g
        transferBuffer[32] = 0xff // 15 b
        transferBuffer[33] = 0xff // 20 r
        transferBuffer[34] = 0xff // 20 g
        transferBuffer[35] = 0xff // 20 b

        return transferBuffer
    }

    async setLEDMode(mode, brightness=0xff, red=0xff, green=0xff, blue=0xff, ledSpeed=0x04, testingNumber=-1) {
        let transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        let rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)

        // Header Packet
        if (SIMPLE_LED_CYCLE.includes(mode)) {
            transferBuffer[0]  = 0x56
            transferBuffer[1]  = 0x81
            transferBuffer[2]  = 0x00
            transferBuffer[3]  = 0x00
            transferBuffer[4]  = 0x01
            transferBuffer[5]  = 0x00
            transferBuffer[6]  = 0x00
            transferBuffer[7]  = 0x00
            transferBuffer[8]  = 0x01
            transferBuffer[9]  = 0x00
            transferBuffer[10] = 0x00
            transferBuffer[11] = 0x00
            transferBuffer[12] = 0x55
            transferBuffer[13] = 0x55
            transferBuffer[14] = 0x55
            transferBuffer[15] = 0x55
        } else {
            if (mode === LED_CYCLE_ENUM['custom']) {
                transferBuffer[0]  = 0x56
                transferBuffer[1]  = 0x81
                transferBuffer[2]  = 0x00
                transferBuffer[3]  = 0x00
                transferBuffer[4]  = 0x01
                transferBuffer[5]  = 0x00
                transferBuffer[6]  = 0x00
                transferBuffer[7]  = 0x00
                transferBuffer[8]  = 0x02
                transferBuffer[9]  = 0x00
                transferBuffer[10] = 0x00
                transferBuffer[11] = 0x00
                transferBuffer[12] = 0xbb
                transferBuffer[13] = 0xbb
                transferBuffer[14] = 0xbb
                transferBuffer[15] = 0xbb
            } else {
                transferBuffer[0]  = 0x56
                transferBuffer[1]  = 0x81
                transferBuffer[2]  = 0x00
                transferBuffer[3]  = 0x00
                transferBuffer[4]  = 0x02
                transferBuffer[5]  = 0x00
                transferBuffer[6]  = 0x00
                transferBuffer[7]  = 0x00
                transferBuffer[8]  = 0x01
            }
        }

        
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);
        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)

        // This code is common in all led changes
        transferBuffer[0]  = 0x56
        transferBuffer[1]  = 0x83
        transferBuffer[4]  = 0x01

        if (SIMPLE_LED_CYCLE.includes(mode)) {
            transferBuffer = this.simpleLedMode(mode, transferBuffer, red, green, blue, brightness, ledSpeed)
        } else {
            if (mode === LED_CYCLE_ENUM['custom']) {
                transferBuffer = await this.customLedMode(transferBuffer)
            } else {
                transferBuffer = this.complexLedMode(mode, transferBuffer, red, green, blue, brightness, ledSpeed)
            }
        }

        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);
        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        
        // Footer 1
        transferBuffer[0]  = 0x41
        transferBuffer[1]  = 0x80
        
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);
        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)

        // footer 2
        transferBuffer[0]  = 0x51
        transferBuffer[1]  = 0x28
        transferBuffer[2]  = 0x00
        transferBuffer[3]  = 0x00
        transferBuffer[4]  = 0xff
        
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);
    }

    release () {
        this.iFace.release();
        if (this.hasDetachedKernelDriver) {
            this.iFace.attachKernelDriver();
        }
    }
}
