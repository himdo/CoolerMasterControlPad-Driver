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
    currentMode;

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

        this.currentMode = mode;
    }

    async applyLEDModes(brightness=0xff, red=0xff, green=0xff, blue=0xff, ledSpeed=0x04) {
        // OUT 1
        let transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        let rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[4] = 0x01
        transferBuffer[6] = 0x04
        transferBuffer[8] = 0x55
        transferBuffer[9] = 0x55
        transferBuffer[10] = 0x55
        transferBuffer[11] = 0x55
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // out 2
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x01 // this means its the second call
        transferBuffer[4] = 0x01
        transferBuffer[6] = 0x0a
        transferBuffer[8] = 0x55
        transferBuffer[9] = 0x55
        transferBuffer[10] = 0x55
        transferBuffer[11] = 0x55
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // out 3
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x02
        transferBuffer[4] = 0x02
        transferBuffer[6] = 0x16
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // out 4
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x03
        transferBuffer[4] = 0x02
        transferBuffer[6] = 0x22
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // out 5
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x04
        transferBuffer[4] = 0x01
        transferBuffer[6] = 0x3f
        transferBuffer[8] = 0xbb
        transferBuffer[9] = 0xbb
        transferBuffer[10] = 0xbb
        transferBuffer[11] = 0xbb
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // out 6
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x05
        transferBuffer[4] = 0x03 // 02 for rainbow wave
        transferBuffer[6] = 0x4a // 48 for rainbow wave
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // out 7
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x06
        transferBuffer[4] = 0x02
        transferBuffer[6] = 0x57 // 55 for rainbow wave
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 8
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x07
        transferBuffer[4] = 0x01
        transferBuffer[6] = 0x5f // 5d for rainbow wave
        transferBuffer[8] = 0x55
        transferBuffer[9] = 0x55
        transferBuffer[10] = 0x55
        transferBuffer[11] = 0x55
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 9
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x08
        transferBuffer[4] = 0x01
        transferBuffer[6] = 0x65 // 63 for rainbow wave
        transferBuffer[8] = 0x55
        transferBuffer[9] = 0x55
        transferBuffer[10] = 0x55
        transferBuffer[11] = 0x55
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 10
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x09
        transferBuffer[4] = 0x02
        transferBuffer[6] = 0x6e // 6c for rainbow wave
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 11
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x0a
        transferBuffer[4] = 0x01
        transferBuffer[6] = 0x77 // 75 for rainbow wave
        transferBuffer[8] = 0x55
        transferBuffer[9] = 0x55
        transferBuffer[10] = 0x55
        transferBuffer[11] = 0x55
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 12
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x0b
        transferBuffer[4] = 0x01
        transferBuffer[6] = 0x7e // 7c for Rb W
        transferBuffer[8] = 0x55
        transferBuffer[9] = 0x55
        transferBuffer[10] = 0x55
        transferBuffer[11] = 0x55
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 13
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x0c
        transferBuffer[4] = 0x02
        transferBuffer[6] = 0x88 // 86 for Rb W
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 14
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x15
        transferBuffer[2] = 0x0d
        transferBuffer[4] = 0x01
        transferBuffer[6] = 0x8d
        transferBuffer[8] = 0xaa
        transferBuffer[9] = 0xaa
        transferBuffer[10] = 0xaa
        transferBuffer[11] = 0xaa
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 15 TODO This one sometimes changes with colors
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[5] = 0x01
        transferBuffer[7] = 0xc1
        transferBuffer[12] = red // red??
        transferBuffer[13] = green // green??
        transferBuffer[14] = blue // blue??
        transferBuffer[15] = brightness // brightness??
        transferBuffer[25] = 0x32
        transferBuffer[27] = 0xc1
        transferBuffer[28] = 0x07
        transferBuffer[32] = 0xff
        transferBuffer[33] = 0xff
        transferBuffer[34] = 0xff
        transferBuffer[35] = 0xff
        transferBuffer[38] = 0x06
        transferBuffer[41] = 0x04
        transferBuffer[42] = 0x08
        transferBuffer[44] = 0x05
        transferBuffer[49] = 0x01
        transferBuffer[51] = 0xc1
        transferBuffer[59] = 0xff
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 16
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x01
        transferBuffer[5] = 0x80
        transferBuffer[7] = 0x80
        transferBuffer[8] = 0x0b
        transferBuffer[9] = 0x10
        transferBuffer[12] = 0xff
        transferBuffer[13] = 0xff
        transferBuffer[14] = 0xff
        transferBuffer[15] = 0xff
        transferBuffer[18] = 0x02
        transferBuffer[19] = 0x01
        transferBuffer[20] = 0x03
        transferBuffer[24] = 0xff
        transferBuffer[25] = 0xff
        transferBuffer[26] = 0xff
        transferBuffer[27] = 0xff
        transferBuffer[28] = 0xff
        transferBuffer[29] = 0xff
        transferBuffer[30] = 0xff
        transferBuffer[31] = 0xff
        transferBuffer[32] = 0x14
        transferBuffer[34] = 0x14
        transferBuffer[36] = 0x0b
        transferBuffer[40] = 0x0f
        transferBuffer[42] = 0x01
        transferBuffer[45] = 0x01
        transferBuffer[47] = 0xc1
        transferBuffer[54] = 0xc6
        transferBuffer[55] = 0xff
        transferBuffer[61] = 0x80
        transferBuffer[63] = 0x80
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 17
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x02
        transferBuffer[4] = 0x0b
        transferBuffer[5] = 0x10
        transferBuffer[8] = 0xff
        transferBuffer[9] = 0xff
        transferBuffer[10] = 0xff
        transferBuffer[11] = 0xff
        transferBuffer[14] = 0x02
        transferBuffer[20] = 0x14
        transferBuffer[22] = 0x14
        transferBuffer[24] = 0x19
        transferBuffer[28] = 0x1d
        transferBuffer[30] = 0x01
        transferBuffer[32] = 0x80
        transferBuffer[33] = 0x01
        transferBuffer[36] = 0xff
        transferBuffer[42] = 0xff
        transferBuffer[43] = 0xff
        transferBuffer[48] = 0xd7
        transferBuffer[49] = 0x52
        transferBuffer[50] = 0xff
        transferBuffer[51] = 0xff
        transferBuffer[52] = 0xff
        transferBuffer[54] = 0xff
        transferBuffer[55] = 0xff
        transferBuffer[57] = 0xff
        transferBuffer[58] = 0xff
        transferBuffer[60] = 0xff
        transferBuffer[63] = 0xff
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 18
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x03
        transferBuffer[4] = 0xff
        transferBuffer[6] = 0xff
        transferBuffer[7] = 0xff
        transferBuffer[9] = 0xff
        transferBuffer[10] = 0xff
        transferBuffer[12] = 0xff
        transferBuffer[13] = 0xff
        transferBuffer[15] = 0xff
        transferBuffer[16] = 0xff
        transferBuffer[18] = 0xff
        transferBuffer[19] = 0xff
        transferBuffer[21] = 0xff
        transferBuffer[22] = 0xff
        transferBuffer[24] = 0xff
        transferBuffer[25] = 0xff
        transferBuffer[27] = 0xff
        transferBuffer[28] = 0xff
        transferBuffer[30] = 0xff
        transferBuffer[31] = 0xff
        transferBuffer[33] = 0xff
        transferBuffer[34] = 0xff
        transferBuffer[36] = 0xff
        transferBuffer[37] = 0xff
        transferBuffer[39] = 0xff
        transferBuffer[40] = 0xff
        transferBuffer[42] = 0xff
        transferBuffer[43] = 0xff
        transferBuffer[45] = 0xff
        transferBuffer[46] = 0xff
        transferBuffer[48] = 0xff
        transferBuffer[49] = 0xff
        transferBuffer[51] = 0xff
        transferBuffer[52] = 0xff
        transferBuffer[54] = 0xff
        transferBuffer[55] = 0xff
        transferBuffer[57] = 0xff
        transferBuffer[58] = 0xff
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 19
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x04
        transferBuffer[16] = 0x25
        transferBuffer[21] = 0x01
        transferBuffer[23] = 0xc1
        transferBuffer[31] = 0xff // 0x00 Rb W
        transferBuffer[37] = 0x40 // 0x01 Rb W
        transferBuffer[39] = 0x80 // c1 Rb W
        transferBuffer[40] = 0x08 // 00 Rb w
        transferBuffer[41] = 0x10 // 00 Rb w
        transferBuffer[44] = 0xff // 00 Rb w
        transferBuffer[45] = 0xff // 00 Rb w
        transferBuffer[46] = 0xff // 00 Rb w
        transferBuffer[47] = 0xff // 00 Rb w
        transferBuffer[50] = 0x01 // 00 Rb w
        transferBuffer[52] = 0x01 // 14 Rb w
        transferBuffer[53] = 0x10 // 00 Rb w
        transferBuffer[54] = 0x08 // 14 Rb w
        transferBuffer[55] = 0x01 // 00 Rb w
        transferBuffer[56] = 0x10 // 40 Rb w
        transferBuffer[60] = 0x14 // 44 Rb w
        transferBuffer[62] = 0x14 // 01 Rb w
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 20
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x05
        transferBuffer[4] = 0x40 // 00 Rb W
        // [7] = 0xc1 Rb W
        transferBuffer[8] = 0x44 // 00 Rb W
        transferBuffer[10] = 0x01 // 00 Rb W
        transferBuffer[13] = 0x01 // 00 Rb W
        transferBuffer[15] = 0xc1 // ff Rb W
        // [20] = 0x81 Rb W
        // [21] = 0x40 Rb W
        transferBuffer[23] = 0xff // 80 Rb W
        // [24] 0x05 Rb W
        // [25] 0x10 Rb W
        transferBuffer[28] = 0x81 // ff Rb W
        transferBuffer[29] = 0x40 // ff Rb W
        transferBuffer[31] = 0x80 // ff Rb W
        transferBuffer[32] = 0x05 // 00 Rb W
        transferBuffer[33] = 0x10 // 00 Rb W
        // [34] = 0x03 Rb W
        transferBuffer[36] = 0xff // 30 Rb W
        transferBuffer[37] = 0xff
        transferBuffer[38] = 0xff // 10 Rb W
        transferBuffer[39] = 0xff // 10 Rb W
        // [40] = 0x01  Rb W
        // [41] = 0x40  Rb W
        transferBuffer[42] = 0x03 // 00 Rb W
        transferBuffer[44] = 0x30 // 14 Rb W
        transferBuffer[45] = 0xff // 00 Rb W
        transferBuffer[46] = 0x10 // 14 Rb W
        transferBuffer[47] = 0x10 // 00 Rb W
        transferBuffer[48] = 0x01 // 4b Rb W
        transferBuffer[49] = 0x40 // 00 Rb W
        transferBuffer[52] = 0x14 // 4f Rb W
        transferBuffer[54] = 0x14 // 01 Rb W
        transferBuffer[56] = 0x4d // 00 Rb W
        // [57] = 0x31 Rb W
        // [59] = 0xc1 Rb W
        transferBuffer[60] = 0x51 // 08 Rb W
        transferBuffer[62] = 0x01 // 00 Rb W
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 21
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x06
        // [4] = 0x40 Rb W
        transferBuffer[5] = 0x31 // 00 Rb W
        //[6] = 0xff Rb W
        transferBuffer[7] = 0xc1 //0xff Rb W
        transferBuffer[8] = 0x08 // 00 Rb W
        // [10] = 0x03 Rb W
        transferBuffer[12] = 0x40 // 00 Rb W
        transferBuffer[14] = 0xff // 00 Rb W
        transferBuffer[15] = 0xff // 00 Rb W
        // [16] = 0x58 Rb W
        transferBuffer[18] = 0x03 // 00 Rb W
        // [21] = 0x30 Rb W
        // [23] = 0xc1 Rb W
        transferBuffer[24] = 0x5a // 0c Rb W
        // [28] = 0xff Rb W
        transferBuffer[29] = 0x30 // ff Rb W
        // [30] = 0xff Rb W
        transferBuffer[31] = 0xc1 // ff Rb W
        transferBuffer[32] = 0x0c // 01 Rb W
        // [34] = 0x04 Rb W
        transferBuffer[36] = 0xff // 00 Rb W
        transferBuffer[37] = 0xff // 00 Rb W
        transferBuffer[38] = 0xff // 00 Rb W
        transferBuffer[39] = 0xff // 00 Rb W
        transferBuffer[40] = 0x01 // 5e Rb W
        transferBuffer[42] = 0x04 // 00 Rb W
        // [45] = 0x01 Rb W
        // [47] = 0xc1 Rb W
        transferBuffer[48] = 0x60 // 00 Rb W
        transferBuffer[53] = 0x01 // 00 Rb W
        transferBuffer[55] = 0xc1 // ff Rb W
        // [60] = 0x28 Rb W
        // [61] = 0x80 Rb W
        transferBuffer[63] = 0xff // 80 Rb W
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 22
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x07
        // [4] = 0x07 Rb W
        transferBuffer[8] = 0x28 // 68 Rb W
        transferBuffer[9] = 0x80 // 00 Rb W
        // [10] = 0x01 Rb W
        transferBuffer[11] = 0x80 // 00 Rb W
        transferBuffer[12] = 0x07 // 00 Rb W
        transferBuffer[13] = 0x10 // 34 Rb W
        // [15] = 0xc1 Rb W
        // [16] = 0x04 Rb W
        transferBuffer[19] = 0xff // 00 Rb W
        //[21] = 0x10 Rb W
        transferBuffer[22] = 0x01 // 00 Rb W
        transferBuffer[24] = 0x14 // 00 Rb W
        transferBuffer[26] = 0x14 // 00 Rb W
        // [27] = 0xff Rb W
        transferBuffer[28] = 0x66 // 00 Rb W
        // [30] = 0x01 Rb W
        transferBuffer[32] = 0x6a // 14 Rb W
        transferBuffer[34] = 0x01 // 14 Rb W
        // [36] = 0x64 Rb W
        transferBuffer[37] = 0x34 // 00 Rb W
        // [38] = 0xff Rb W
        transferBuffer[39] = 0xc1 // ff Rb W
        transferBuffer[40] = 0x04 // 00 Rb W
        // [42] = 0xfd Rb W
        // [45] = 0x80 Rb W
        transferBuffer[46] = 0xff // 00  Rb W
        transferBuffer[47] = 0xff // 00 Rb W
        // [48] = 0x30 Rb W
        transferBuffer[50] = 0xfd //10 Rb W
        // [52] = 0x6f Rb W
        transferBuffer[53] = 0x80 // 00 Rb W
        transferBuffer[56] = 0x30 // 00 Rb W
        // [57] = 0x83 Rb W
        transferBuffer[58] = 0x10 // 00 Rb W
        // [59] = 0xc1 Rb W
        transferBuffer[60] = 0x71 // 04 Rb W
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 23
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x08
        transferBuffer[5] = 0x83 // 00 Rb W
        // [6] = 0xff Rb W
        transferBuffer[7] = 0xc1 // ff Rb W
        transferBuffer[8] = 0x04 // 00 Rb W
        // [10] = 0xfd Rb W
        // [13] = 0x80 Rb W
        transferBuffer[14] = 0xff // 00 Rb W
        transferBuffer[15] = 0xff // 00 Rb W
        // [16] = 0x30 Rb W
        transferBuffer[18] = 0xfd // 10 Rb W
        // [20] = 0x76 Rb W
        transferBuffer[21] = 0x80 // 00 Rb W
        transferBuffer[24] = 0x30 // 00 Rb W
        // [25] = 0x01 Rb W
        transferBuffer[26] = 0x10 // 00 Rb W
        // [27] = 0xc1 Rb W
        transferBuffer[28] = 0x78 // 00 Rb W
        transferBuffer[33] = 0x01 // 00 Rb W
        transferBuffer[35] = 0xc1 // ff Rb W
        // [40] = 0x01 Rb W
        // [41] = 0x82 Rb W
        transferBuffer[43] = 0xff // 80 Rb W
        // [44] = 0x0c Rb W
        // [45] = 0x10 Rb W
        transferBuffer[48] = 0x01 // ff Rb W
        transferBuffer[49] = 0x82 // ff Rb W
        // [50] = 0xff Rb W
        transferBuffer[51] = 0x80 // ff Rb W
        transferBuffer[52] = 0x0c // 00 Rb W
        transferBuffer[53] = 0x10 // 00 Rb W
        // [54] = 0x06 Rb W
        transferBuffer[56] = 0xff // 00 Rb W
        transferBuffer[57] = 0xff // 90 Rb W
        transferBuffer[58] = 0xff // 14 Rb W
        transferBuffer[59] = 0xff // 20 Rb W
        // [60] = 0x14 Rb W
        transferBuffer[62] = 0x06 // 14 Rb W
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 24
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x09
        // [4] = 0x7d Rb W
        transferBuffer[5] = 0x90 // 00 Rb W
        transferBuffer[6] = 0x14 // 00 Rb W
        transferBuffer[7] = 0x20 // 00 Rb W
        transferBuffer[8] = 0x14 //81 Rb W
        transferBuffer[10] = 0x14 // 01 Rb W
        transferBuffer[12] = 0x7f // 10 Rb W
        // [15] = 0xc1 Rb W
        transferBuffer[16] = 0x83 // 00 Rb W
        transferBuffer[18] = 0x01 // 00 Rb W
        transferBuffer[20] = 0x10 // 89 Rb W
        transferBuffer[23] = 0xc1 // 00 Rb W
        transferBuffer[28] = 0x8b // 00 Rb W
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 25
        transferBuffer[0] = 0x56
        transferBuffer[1] = 0x21
        transferBuffer[2] = 0x0a
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 26
        transferBuffer[0] = 0x41
        transferBuffer[1] = 0x80
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 27
        transferBuffer[0] = 0x51
        transferBuffer[1] = 0x28
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 28
        transferBuffer[0] = 0x41
        transferBuffer[1] = 0x01
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 29
        transferBuffer[0] = 0x50
        transferBuffer[1] = 0x55
        await this.commandTransfer(transferBuffer);
        await this.interruptTransfer(rxBuffer);

        transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)
        // Out 30
        transferBuffer[0] = 0x41
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
