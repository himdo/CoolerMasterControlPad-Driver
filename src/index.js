import {CMCp, LED_CYCLE_ENUM} from './devices/CMCp.js';
import { delay } from './utils.js'


/**
 * 
 * Valid JSON Schema:
 * {
 *   "type": typeNumber (int: see LED_CYCLE_ENUM for number references),
 *   "mode": setNumber (int: 1 == set / preview || 2 == apply),
 *   "brightness": brightnessValue (hex 0x00 -> 0xff),
 *   "red": redValue (hex 0x00 -> 0xff),
 *   "green": greenValue (hex 0x00 -> 0xff),
 *   "blue": blueValue (hex 0x00 -> 0xff),
 *   "ledSpeed": speedValue (hex 0x00 -> 0xff),
 *   "additionalData": {  // Only used for custom type (AKA: type 4)
 *     "customLedColors": [
 *       [hex for red, hex for green, hex for blue, hex for brightness], // LED 1 Color
 *       [hex for red, hex for green, hex for blue, hex for brightness], // LED 2 Color
 *       [hex for red, hex for green, hex for blue, hex for brightness], // LED 3 Color
 *       
 *       ...
 *       
 *       [hex for red, hex for green, hex for blue, hex for brightness], // LED 23 Color
 *       [hex for red, hex for green, hex for blue, hex for brightness], // LED 24 Color
 *     ],
 *   }
 * }
 * 
 * the only required is type
 * if mode is not sent then it will be set / preview
 * if brightness is not set it will be 0xff
 * if red is not set it will be 0xff
 * if green is not set it will be 0xff
 * if blue is not set it will be 0xff
 * if ledSpeed is not set it will be 0x04
 * 
 * 
 * Aditional data is used for custom where it has a customLedColors array of arrays,
 * the customLedColors array in the array has 4 elements in it:
 * hex for red        0x00 - 0xff   defaults to 0x00
 * hex for green      0x00 - 0xff   defaults to 0x00
 * hex for blue       0x00 - 0xff   defaults to 0x00
 * hex for brightness 0x00 - 0xff   defaukts to 0xff
 * if any part is missing it will use the defaults (including it there is less then 24 arrays in the array)
 * 
 */

// TODO add testing framework to validate this works
function parsedParamValidator (parsedData) {
    if (typeof parsedData['type'] === 'undefined') { // make sure type is set
        return -1
    }
    if (typeof parsedData["mode"] !== 'number') {
        parsedData["mode"] = 1
    }

    if (typeof parsedData["brightness"] !== 'number') {
        parsedData["brightness"] = 0xff
    }

    if (typeof parsedData["red"] !== 'number') {
        parsedData["red"] = 0xff
    }

    if (typeof parsedData["green"] !== 'number') {
        parsedData["green"] = 0xff
    }

    if (typeof parsedData["blue"] !== 'number') {
        parsedData["blue"] = 0xff
    }

    if (typeof parsedData["brightness"] !== 'number') {
        parsedData["brightness"] = 0xff
    }

    if (typeof parsedData["ledSpeed"] !== 'number') {
        parsedData["ledSpeed"] = 0x04
    }


    return parsedData
}

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

// main().then((exitCode) => process.exit(exitCode))
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