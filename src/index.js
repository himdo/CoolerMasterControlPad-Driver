import {CMCp, LED_CYCLE_ENUM} from './devices/CMCp.js';
import { delay, parsedParamValidator } from './utils.js'



const main = async () => {
    let driver
    let exitCode = 1
    let parsedData
    
    if (process.argv.length >= 3) {
        console.log(process.argv[2])
        try {
            parsedData = JSON.parse(process.argv[2])
            
            parsedData = parsedParamValidator(parsedData)
            if (parsedData === -1) {
                console.error("Failed param validation make sure to have {\"type\":INT} at least ")
                return -1
            }
            
        } catch(err) {
            console.log("The variable should be valid json with the schema: TODO")
            console.error(err)
            return -1
        }
    }

    try {
        driver = new CMCp()
        // await driver.setLEDMode(LED_CYCLE_ENUM['static'],0xff,0x00,0xff,0x00)
        // await delay(3000)
        // await driver.setLEDMode(LED_CYCLE_ENUM['color cycle'])
        // await delay(3000)
        // await driver.setLEDMode(LED_CYCLE_ENUM['rainbow wave'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['crosshair'],0xff)
        // await driver.setLEDMode(LED_CYCLE_ENUM['reactive fade'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['custom'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['stars'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['snowing'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['color cycle'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['breathing'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['reactive punch'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['circle spectrum'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['reactive tornado'])
        // await driver.setLEDMode(LED_CYCLE_ENUM['water ripple'])
        await driver.setLEDMode(LED_CYCLE_ENUM['turn off'])
        // await delay(3000)
        // await delay(1000)
        await driver.applyLEDModes(LED_CYCLE_ENUM['rainbow wave'], 0xff,0x00,0x00,0xff,0x02)
    } catch (err) {
        console.log(err)
        exitCode = -1
    } finally {
        if (driver) {
            driver.release()
        }
        return exitCode
    }
}

main().then((exitCode) => process.exit(exitCode))
/**
 *    deviceDescriptor: {
    bLength: 18,
    bDescriptorType: 1,
    bcdUSB: 272,
    bDeviceClass: 0,
    bDeviceSubClass: 0,
    bDeviceProtocol: 0,
    bMaxPacketSize0: 8,
    idVendor: 9610,
    idProduct: 4103,
    bcdDevice: 256,
    iManufacturer: 1,
    iProduct: 2,
    iSerialNumber: 0,
    bNumConfigurations: 1
  },
  portNumbers: [ 20 ]
 */

export {main, parsedParamValidator}