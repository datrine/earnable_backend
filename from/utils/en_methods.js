
function _hexStringToBuffer(hex_string) {
    let hexArray = hex_string.split(" ");
    return _hexArrayToBuffer(hexArray)
}

function _bufferToHex(buffer) {
    var hexArr = [];
    var bytes = new Uint16Array(buffer);
    var len = bytes.length;
    for (let i = 0; i < len; i++) {
        hexArr.push(bytes[i].toString(16));
    }
    console.log(hexArr)
    return hexArr;
}

function _hexArrayToBuffer(hexArr = []) {
    var bytes = new Uint16Array(hexArr.length);
    var len = bytes.length;
    for (let i = 0; i < len; i++) {
        bytes[i] = parseInt(hexArr[i], 16);
    }
    console.log(bytes)
    return bytes;
}

function _charToBuffer(str = "") {
    var len = str.length;
    var bytes = new Uint16Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = str.codePointAt(i);
    }
    console.log(bytes)
    return bytes;
}

function _bufferToChar(buffer) {
    let str = "";
    var bytes = new Uint16Array(buffer);
    var len = bytes.length;
    for (var i = 0; i < len; i++) {
        str += String.fromCodePoint(bytes[i])
    }
    //str+= String.fromCharCode([...bytes])
    console.log(str)
    return str;
}

function uint16To8(buffer = new Uint16Array()) {
    return new Uint8Array(buffer)
}

function uint8To16(buffer = new Uint8Array()) {
    return new Uint16Array(buffer)
}

function charToUint8(str) {
    //return uint16To8(_charToBuffer(str))
    return uint16To8(str)
}

function uint8ToChar(buffer) {
    //return _bufferToChar(uint8To16(buffer))
    return _bufferToChar(buffer)
}

module.exports= {
    _bufferToChar, _bufferToHex, _charToBuffer,
    _hexArrayToBuffer, _hexStringToBuffer,
    uint16To8, uint8To16, uint8ToChar, charToUint8
}
