const { clientConn } = require(".");
const db = clientConn.db("mini_chat");
const tokensCol = db.collection("tokens");
const usersCol = db.collection("users");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");

async function saveToken({ token, factor,type, factorValue, ttl }) {
    try {
        let insertRes = await tokensCol.insertOne({
            token,
            factor,
            type,
            factorValue,
            ttl,
            createdOn: new Date()
        });
        if (!insertRes) {
            throw "Token not save..."
        }
        return insertRes
    } catch (error) {
        console.log(error)
    }
}

async function findAndVerifyToken({ token }) {
    try {
        console.log("token.... " + token);
        let findTokenRes=await findToken({ token });
        console.log(findTokenRes);
        if (findTokenRes.err) {
            return findTokenRes
        }
        let result = await tokensCol.findOneAndUpdate({
            token:Number(token),
            //ttl: { $gte: new Date() }
        }, { $set: { verified: true, time_verified: new Date() } },
            { returnDocument: "after" });
            console.log( result);
            let { ok, value: tokenDoc } =result
        if (!tokenDoc) {
            return { err: { msg: "Token does not match record..." } }
        }
        if (!ok) {
            return { err: { msg: "Token already used..." } }
        }
        return { tokenDoc }
    } catch (error) {
        console.log(error)
    }
}

async function findToken({ token }) {
    try {
        let tokenDoc = await tokensCol.findOne({
            token:Number(token),
        });
        if (!tokenDoc) {
            return { err: {msg:"Token does not exist..."} }
        }
        if (token !== tokenDoc.token) {
            return { err: {msg:"Token does not match record..."} }
        }
        if (new Date(tokenDoc.ttl) < new Date()) {
            return { err: {msg:"Token has expired..."} }
        }
        return { tokenDoc }
    } catch (error) {
        console.log(error)
    }
}

async function verifyToken(data = { token, factorValue }) {
    try {
        let { err, tokenDoc } = await findToken(data);
        if (!tokenDoc) {
            return false;
        }
        return true;
    } catch (error) {
        console.log(error)
    }
}

module.exports = { saveToken, findToken, verifyToken, findAndVerifyToken };