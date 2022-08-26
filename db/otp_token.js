const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const otpTokensCol = db.collection("otps");

async function saveOTPToken({ otp, platforms, accountID, ttl }) {
    try {
        let insertRes = await otpTokensCol.insertOne({
            otp, platforms, accountID,
            ttl,
            createdOn: new Date()
        });
        if (!insertRes) {
            throw "OTP Token not save..."
        }
        return insertRes
    } catch (error) {
        console.log(error)
    }
}

async function findAndVerifyOTPToken({  otp }) {
    try {
        console.log("OTP token.... " + otp);
        let findTokenRes=await findOTPToken({  otp });
        if (findTokenRes.err) {
            return findTokenRes
        }
        let result = await otpTokensCol.findOneAndUpdate({
             otp,
            //ttl: { $gte: new Date() }
        }, { $set: { verified: true, time_verified: new Date() } },
            { returnDocument: "after" });
            let { ok, value: tokenDoc } =result
        if (!tokenDoc) {
            return { err: { msg: "OTP Token does not match record..." } }
        }
        if (!ok) {
            return { err: { msg: "OTP Token already used..." } }
        }
        return { tokenDoc }
    } catch (error) {
        console.log(error)
    }
}

async function findOTPToken({ otp }) {
    try {
        let tokenDoc = await otpTokensCol.findOne({
             otp,
        });
        if (!tokenDoc) {
            return { err: {msg:"OTP does not exist..."} }
        }
        if (otp !== tokenDoc.otp) {
            return { err: {msg:"OTP does not match record..."} }
        }
        if (new Date(tokenDoc.ttl) < new Date()) {
            return { err: {msg:"OTP has expired..."} }
        }
        return { tokenDoc }
    } catch (error) {
        console.log(error)
    }
}

async function verifyOTPToken(data = { otp, factorValue }) {
    try {
        let { err, tokenDoc } = await findOTPToken(data);
        if (!tokenDoc) {
            return false;
        }
        return true;
    } catch (error) {
        console.log(error)
    }
}

module.exports = { saveOTPToken, findOTPToken, verifyOTPToken, findAndVerifyOTPToken };