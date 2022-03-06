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

    async setLEDMode(mode) {
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
        transferBuffer[2]  = 0x00
        transferBuffer[3]  = 0x00
        transferBuffer[4]  = 0x01
        transferBuffer[5]  = 0x00
        transferBuffer[6]  = 0x00
        transferBuffer[7]  = 0x00
        transferBuffer[8]  = 0x00

        if (mode === LED_CYCLE_ENUM['static']) { // done
            transferBuffer[9]  = 0x01
            transferBuffer[11] = 0xc1
            transferBuffer[16] = 0xd9
            transferBuffer[17] = 0x52
            transferBuffer[18] = 0xff
            transferBuffer[19] = 0xff
            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['rainbow wave']) { //done
            transferBuffer[9]  = 0x32
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x07
            transferBuffer[16] = 0xff
            transferBuffer[17] = 0xff
            transferBuffer[18] = 0xff
            transferBuffer[19] = 0xff
            transferBuffer[22] = 0x06
            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['crosshair']) { // done with fix
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
            transferBuffer[40] = 0xff
            transferBuffer[41] = 0xff
            transferBuffer[42] = 0xff
            transferBuffer[43] = 0xff
            transferBuffer[46] = 0x02
            transferBuffer[47] = 0x01
            transferBuffer[48] = 0x03
            transferBuffer[52] = 0xff
            transferBuffer[53] = 0xff
            transferBuffer[54] = 0xff
            transferBuffer[55] = 0xff
            transferBuffer[56] = 0xff
            transferBuffer[57] = 0xff
            transferBuffer[58] = 0xff
            transferBuffer[59] = 0xff

            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['reactive fade']) { // done with fix
            transferBuffer[4]  = 0x0c
            transferBuffer[6]  = 0x0c
            transferBuffer[8]  = 0x03
            transferBuffer[12] = 0x07
            transferBuffer[14] = 0x01
            transferBuffer[17] = 0x01
            transferBuffer[19] = 0xc1
            transferBuffer[26] = 0xc6
            transferBuffer[27] = 0xff
            transferBuffer[33] = 0x80
            transferBuffer[35] = 0x80
            transferBuffer[36] = 0x0b
            transferBuffer[37] = 0x10
            transferBuffer[40] = 0xff
            transferBuffer[41] = 0xff
            transferBuffer[42] = 0xff
            transferBuffer[43] = 0xff
            transferBuffer[46] = 0x02
            transferBuffer[52] = 0xff
            transferBuffer[53] = 0xff
            transferBuffer[54] = 0xff
            transferBuffer[55] = 0xff
            transferBuffer[56] = 0xff
            transferBuffer[57] = 0xff
            transferBuffer[58] = 0xff
            transferBuffer[59] = 0xff

            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['custom']) { // done needed second send
            transferBuffer[8]  = 0x80
            transferBuffer[9]  = 0x01
            transferBuffer[12] = 0xff
            transferBuffer[18] = 0xff
            transferBuffer[19] = 0xff
            transferBuffer[24] = 0xd7
            transferBuffer[25] = 0x52
            transferBuffer[26] = 0xff
            transferBuffer[27] = 0xff
            transferBuffer[28] = 0xff
            transferBuffer[30] = 0xff
            transferBuffer[31] = 0xff
            transferBuffer[33] = 0xff
            transferBuffer[34] = 0xff
            transferBuffer[36] = 0xff
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
            transferBuffer[60] = 0xff
            transferBuffer[61] = 0xff
            transferBuffer[63] = 0xff


            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
            transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)
            rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)

            transferBuffer[0] = 0x56
            transferBuffer[1] = 0x83
            transferBuffer[2] = 0x01
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
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
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
            transferBuffer[40] = 0xff
            transferBuffer[41] = 0xff
            transferBuffer[42] = 0xff
            transferBuffer[43] = 0xff
            transferBuffer[46] = 0x01
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

            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
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
            transferBuffer[40] = 0xff
            transferBuffer[41] = 0xff
            transferBuffer[42] = 0xff
            transferBuffer[43] = 0xff
            transferBuffer[46] = 0x03
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

            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['color cycle']) { // done 
            transferBuffer[9]  = 0x31
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x08
            transferBuffer[16] = 0x40
            transferBuffer[18] = 0xff
            transferBuffer[19] = 0xff
            transferBuffer[22] = 0x03
            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['breathing']) { // done
            transferBuffer[9]  = 0x30
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x0c
            transferBuffer[16] = 0xff
            transferBuffer[17] = 0xff
            transferBuffer[18] = 0xff
            transferBuffer[19] = 0xff
            transferBuffer[20] = 0x01
            transferBuffer[22] = 0x04
            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['reactive punch']) { // Doesnt work IDK Why
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
            transferBuffer[40] = 0b11111111//0xff // This changes the forgound color from black to red
            // first for digits are brightness, last 4 are unknown
            transferBuffer[43] = 0xff
            transferBuffer[46] = 0x01
            transferBuffer[48] = 0xff
            transferBuffer[49] = 0xff
            transferBuffer[50] = 0xff
            transferBuffer[51] = 0xff
            transferBuffer[52] = 0xff
            transferBuffer[53] = 0xff
            transferBuffer[54] = 0xff
            transferBuffer[55] = 0xff
            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['circle spectrum']) { // Done
            transferBuffer[9]  = 0x34
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x04
            transferBuffer[18] = 0xff
            transferBuffer[19] = 0xff
            transferBuffer[22] = 0xfd
            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['reactive tornado']) { // Done
            transferBuffer[9]  = 0x83
            transferBuffer[11] = 0xc1
            transferBuffer[12] = 0x04
            transferBuffer[18] = 0xff
            transferBuffer[19] = 0xff
            transferBuffer[22] = 0xfd
            transferBuffer[25] = 0x80
            transferBuffer[27] = 0x10

            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
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
            transferBuffer[40] = 0xff // the first part changes color saturation
            transferBuffer[41] = 0xff
            transferBuffer[42] = 0xff
            transferBuffer[43] = 0xff
            transferBuffer[46] = 0x06
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
            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        } else if (mode === LED_CYCLE_ENUM['turn off']) { // Done
            transferBuffer[8]  = 0x01
            transferBuffer[11] = 0xc1
            
            await this.commandTransfer(transferBuffer);
            await this.interruptTransfer(rxBuffer);
        }

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
