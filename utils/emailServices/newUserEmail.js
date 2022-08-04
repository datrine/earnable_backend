const composeEmail = require("./composeEmail");
const { mongoClient } = require("../../utils/conn/mongoConn");
const { encodeText, makeWebSafe, decodeText,decodeWebSafeTxt } = require("../encdec");
const waleprjDB = mongoClient.db("waleprj");
const usersCol = waleprjDB.collection("users")

function emailUtilForNewUser(user) {
    let opts = {
        from: process.env.WELCOME_USER_TO_EMAIL,
        to: user.email,
        text: "Thank you for registering with us. You can click on this link to ",
        //html,
    }
    return composeEmail(opts).then(res => {

    }).catch(err => {
        console.log(err)
    })
}

function sendEmailVerification(user) {
    let expires = Date.now() + 3600
    let data = {
        email: user.email,
        expires
    }
    let key = process.env.EMAIL_VERIFICATION_KEY
    let token = makeWebSafe(encodeText({ data, key }));
    console.log(token)
    let opts = {
        from: process.env.WELCOME_USER_TO_EMAIL,
        to: user.email,
        text: `Thank you for registering with us. 
        You can click on the link below to verify your email.
       ${process.env.HOST_URL}/api/email/verify?token=${token}
       Link expires by ${new Date(expires).toTimeString()}.
        `,
        //html,
    }
    return composeEmail(opts).then(res => {

    }).catch(err => {
        console.log(err)
    })
}

function validateEmailTokenVerification(token) {
    try {
        let cipher = decodeWebSafeTxt(token)
        let key = process.env.EMAIL_VERIFICATION_KEY
        console.log(cipher)
        let data = JSON.parse(decodeText({ cphTxt: cipher, key }));
        if (typeof data !== "object") {
            throw console.log("The token is invalid...")
        }
        if (new Date(data.expires).getTime() > Date.now()) {
            throw console.log("To to validate has expired...")
        }
        console.log(data)
        return data;
    } catch (error) {
        throw error
    }
}

module.exports = { emailUtilForNewUser, sendEmailVerification, validateEmailTokenVerification }