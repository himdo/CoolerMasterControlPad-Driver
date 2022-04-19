import * as fs from 'fs';

let fileLocations = [
'/home/ubuntu/projects/node/CoolerMasterControlPad-Driver/Other Tests/ApplyingKeyMapping(21 l ctrl) (starting at 25).json',
'/home/ubuntu/projects/node/CoolerMasterControlPad-Driver/Other Tests/ApplyingKeyMapping(1 1, 21 l ctrl) (starting at 25).json',
// '/home/ubuntu/projects/node/CoolerMasterControlPad-Driver/Other Tests/apply kwy mapping hex.json',
]

let dataLocation = ["_source", "layers", "usbhid.data"]

let foundData = []

let fileLocationData = []
let maxIndex = -1
for (let i = 0; i<fileLocations.length; i++) {
    let data = JSON.parse(fs.readFileSync(fileLocations[i], 'utf8'))
    if (data.length > maxIndex)
        maxIndex = data.length
    fileLocationData.push(data)
}

for (let i = 0; i < maxIndex; i++) {
    let dataSets = []
    for (let x = 0; x < fileLocationData.length; x++) {
        let dataSegement = fileLocationData[x][i]
        if (typeof dataSegement === 'undefined') {
            break
        }
        for (let innerLocationIndex = 0; innerLocationIndex < dataLocation.length; innerLocationIndex++) {
            if (typeof dataSegement === 'undefined') {
                break
            }
            dataSegement = dataSegement[dataLocation[innerLocationIndex]]
        }
        let dataArray = dataSegement.split(':').reverse()
        let filteredData = []
        let foundNumbers = false
        for (let y = 0; y < dataArray.length; y++) {
            if (dataArray[y] === '00' && foundNumbers === false) {
                continue
            } else {
                foundNumbers = true
            }
            filteredData.push(dataArray[y])
        }
        filteredData = filteredData.reverse().join(" ")
        dataSets.push(filteredData)
    }
    let firstData = dataSets[0]
    let sameData = true
    for (let x = 1; x < dataSets.length; x++) {
        if (dataSets[x] !== firstData) {
            sameData = false
            console.log('Different Data: #' + i)
        }
    }
    if (sameData === true) {
        foundData.push([dataSets[0]])
    } else {
        foundData.push(dataSets)
    }
}

fs.writeFileSync("data.json",JSON.stringify(foundData, null, 4))