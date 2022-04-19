# This is experimental driver for Cooler Master ControlPad 24 Keys
This program accepts 1 param which is a stringified json blob with the following schema:

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




## Currently done
* preview of all default rgb profiles (More testing is need to figure out colors)


## Todo
* Implement this as an electon app to replace Cooler Masters software



# Mentions
* This is inspired by and relys heavly on code writen by "Low Level JavaScript" on youtube (https://www.youtube.com/watch?v=is9wVOKeIjQ&t=54s) and his github page (https://github.com/francisrstokes/GMMK-Driver)