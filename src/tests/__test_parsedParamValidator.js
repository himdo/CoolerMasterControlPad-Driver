import { parsedParamValidator } from '../utils.js'
import { strict } from 'assert'

function testNoTypePassed() {
    strict.equal(parsedParamValidator(JSON.parse("{}")), -1)
}

function testNothingPassed() {
    strict.equal(parsedParamValidator(""), -1)
}

function testTypeOnlyPassed() {
    let type = 0
    let expectedData = {
        "mode": 1,
        "type": type,
        "brightness": 0xff,
        "red": 0xff,
        "green": 0xff,
        "blue": 0xff,
        "ledSpeed": 0x04,
    }
    strict.deepEqual(parsedParamValidator(JSON.parse("{\"type\":"+type+"}")), expectedData)
}

function testTypeAndBrightnessPassed() {
    let type = 0
    let brightness = 0x01
    let expectedData = {
        "mode": 1,
        "type": type,
        "brightness": brightness,
        "red": 0xff,
        "green": 0xff,
        "blue": 0xff,
        "ledSpeed": 0x04,
    }
    strict.deepEqual(parsedParamValidator(JSON.parse("{\"type\":"+type+",\"brightness\":"+brightness+"}")), expectedData)
}

const functions = [
    {"name":"testNoTypePassed", "function": testNoTypePassed},
    {"name":"testNothingPassed", "function": testNothingPassed},
    {"name":"testTypeOnlyPassed", "function": testTypeOnlyPassed},
    {"name":"testTypeAndBrightnessPassed", "function": testTypeAndBrightnessPassed},
]


function main () {
    let errorCount = 0
    let errorMessages = ""
    for (let i = 0; i < functions.length; i++) {
        try {
            console.log("Running: " + functions[i]["name"])
            functions[i]["function"]()
        } catch (error) {
            errorCount ++
            errorMessages += functions[i]["name"]+"() Failed: \n\n\n" + error + "\n\n\n"
        }    
    }

    if (errorCount>0) {
        console.error("\n\n############\nFAILED\n############\n")
        console.error("Number Failed: " + errorCount)
        console.error(errorMessages)
    } else {
        console.log("\n\n############\nSUCCESS\n############\n")
        console.log("No Errors Found")
    }
}


main()