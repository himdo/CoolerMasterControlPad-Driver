import * as fs from 'fs';

let massUSBPackets = [
    {
        "codeName": "static",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "rainbow wave",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "crosshair",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "reactive fade",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "custom",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "stars",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "snowing",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "color cycle",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "breathing",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "reactive punch",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "circle spectrum",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "reactive tornado",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "water ripple",
        "numOfPackets": 30,
        "packets": []
    },
    {
        "codeName": "turn off",
        "numOfPackets": 30,
        "packets": []
    }
]

// Get all the data from the file in the args and put the raw packets into the massUSBPackets object
let jsonFile = fs.readFileSync(process.argv.slice(2)[0], 'utf8')
let jsonFileData = JSON.parse(jsonFile)
for (let packetIndex in jsonFileData) {
    let currentPacketData = jsonFileData[packetIndex]
    massUSBPackets[Math.floor(packetIndex/30)]["packets"].push(currentPacketData["_source"]["layers"]["usbhid.data"].split(":"))
}

// Determine what is common on all the packets and put it into common USB
let commonUSB = []
let massUSBCount = massUSBPackets.length
for (let i = 0; i < 30; i++) {
    let fullPacket = []
    for (let currentPacketToLookAt = 0; currentPacketToLookAt < 64; currentPacketToLookAt++) {
        let foundSame = true
        let currentData = "-1"
        for (let massUSBIndex = 0; massUSBIndex < massUSBCount; massUSBIndex++) {
            let currentDataVariable = massUSBPackets[massUSBIndex]['packets'][i][currentPacketToLookAt]
            if (currentData === "-1") {
                currentData = currentDataVariable
                continue
            }
            if (currentData !== currentDataVariable) {
                currentData = "-1"
                foundSame = false
                break
            }
        }
        fullPacket.push(currentData)
    }
    commonUSB.push(fullPacket)
}

// Trim out all the ending 00s from the common so its decompressed
let trimmedCommonUSB = []
for (let commonUSBIndex = 0; commonUSBIndex < commonUSB.length; commonUSBIndex++) {
    let cloned = commonUSB[commonUSBIndex]
    let fullCommonUSB = cloned.reverse()
    let indexToRemove
    for (let i = 0; i < fullCommonUSB.length; i++) {
        if (fullCommonUSB[i] == '00') {
            continue
        } else {
            indexToRemove = i
            break
        }
    }
    fullCommonUSB.splice(0,indexToRemove)
    fullCommonUSB.reverse()
    trimmedCommonUSB.push(fullCommonUSB)
}
// console.log(trimmedCommonUSB)

// Creates the code for apply USB
let finishedCode = ""
for (let trimmedIndex in trimmedCommonUSB) {
    let trimmedPacket = trimmedCommonUSB[trimmedIndex]
    finishedCode += "transferBuffer = Buffer.alloc(MAX_PACKET_SIZE)\n"
    finishedCode += "rxBuffer = Buffer.alloc(MAX_PACKET_SIZE)\n"
    let packetNumber = parseInt(trimmedIndex) + 1
    finishedCode += "// Out " + packetNumber + "\n"
    for (let innerIndex in trimmedPacket) {
        let data = trimmedPacket[innerIndex]
        if (data === '00' || data === "-1") continue
        finishedCode += "transferBuffer["+innerIndex+"] = 0x" + data + "\n"
    }
    let indexsOfRandom = []

    if (trimmedPacket.includes("-1")) {
        for (let i = 0; i < trimmedPacket.length; i++) {
            if (trimmedPacket[i] === "-1") {
                indexsOfRandom.push(i)
            }
        }
    }
    
    if (indexsOfRandom.length > 0) {
        for (let i = 0; i < massUSBPackets.length; i++) {
            let startingString = "if (mode === LED_CYCLE_ENUM['" + massUSBPackets[i].codeName + "']) {"
            if (i > 0) {
                startingString = "} else " + startingString
            }
            finishedCode += startingString + "\n"

            for (let indexRandom = 0; indexRandom < indexsOfRandom.length; indexRandom++) {
                let index = indexsOfRandom[indexRandom]
                if (massUSBPackets[i].packets[trimmedIndex][index] === "00") continue
                finishedCode += "transferBuffer["+index+"] = 0x" + massUSBPackets[i].packets[trimmedIndex][index] + "\n"
            }

            if (i === massUSBPackets.length - 1) {
                finishedCode += "}\n"
            }
        }
        finishedCode += "\n"
    }
    finishedCode += "await this.commandTransfer(transferBuffer);\n"
    finishedCode += "await this.interruptTransfer(rxBuffer);\n"
}

// console.log(finishedCode)
fs.writeFileSync("CodeOut.js",finishedCode)