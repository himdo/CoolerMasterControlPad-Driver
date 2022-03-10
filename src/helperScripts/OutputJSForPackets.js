let hex = "56 21 0a"

let hexSplit = hex.split(" ")

let packetString = ""

for (let index = 0; index < hexSplit.length; index ++) {
    let hexPacket = hexSplit[index]
    if (hexPacket === "00") {
        continue
    }

    packetString += "transferBuffer["+index.toString()+"] = 0x"+hexPacket+"\n"
}

console.log(packetString)
