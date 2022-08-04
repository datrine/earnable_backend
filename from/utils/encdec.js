const CryptoJS = require("crypto-js");
const base64url = require('base64-url')
var jwt = require('jsonwebtoken');
let secretKey = process.env.TOKEN_SECRET_KEY;
let {clientConn}=require("../db/")
//const { mongoClient } = require("../utils/conn/mongoConn");
const questions_megaDB = clientConn.db("questions_mega");
const sessionsCol = questions_megaDB.collection("sessions")

async function getToken(payload = { email, _id }) {
    try {
        console.log(payload)
        var token = jwt.sign({
            ...payload
        }, secretKey, { expiresIn: "1d", });

        let result = await sessionsCol.findOneAndUpdate({
            //userId: payload._id,
            email: payload.email,
        }, {
           $set:{ userId: payload._id,
            email: payload.email,
            token}
        }, { upsert: true });
        if (result.ok) {
            console.log("Token is created and saved...")
        }
        return token
    } catch (error) {
        console.log(error)
    }
}

async function verifyToken(token, done = () => { }, opts) {
    try {
        var data = jwt.verify(token, secretKey);
        let result = await sessionsCol.findOne({
            //userId: data._id,
            email: data.email,
            token
        });
        if (!result) {
            console.log("Token does not exist in data...")
        }
        return done(null, data)
    } catch (error) {
        console.log(error)
        return done(error, null)
    }
}

function makeWebSafe(txt) {
    return base64url.encode(txt)
}

function decodeWebSafeTxt(txt) {
    return base64url.decode(txt)
}

function encodeText({ key, data }) {
    let res = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    return res
}

function decodeText({ cphTxt, key }) {
    return CryptoJS.AES.decrypt(cphTxt, key).toString(CryptoJS.enc.Utf8)
}



module.exports = {
    encodeText, decodeText, makeWebSafe,
    decodeWebSafeTxt, getToken, verifyToken
}
