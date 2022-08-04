const { SignJWT } = require('jose/dist/node/cjs/jwt/sign')
//const {EncryptJWT  } = require('jose/dist/node/cjs/jwt/encrypt.js')
var fs = require('fs');
var {createPrivateKey,createSecretKey} = require("crypto");
const { EncryptJWT } = require('jose/dist/node/cjs/jwt/encrypt');
//let privateKey=createSecretKey(fs.readFileSync( "../key.pem"))
let privateKey=createSecretKey(Buffer.from( "datrine","utf8"))
console.log(privateKey)

async function name() {

console.log(privateKey)
    const jwt = await new EncryptJWT({ 'urn:example:claim': true })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setIssuer('urn:example:issuer')
    .setAudience('urn:example:audience')
    .setExpirationTime('2h')
    .encrypt(privateKey)
console.log(jwt)

}

name()