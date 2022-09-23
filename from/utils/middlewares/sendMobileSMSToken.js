let nodemailer = require("nodemailer");
const { DateTime } = require("luxon");
const { saveToken } = require("../../../db/token");
const { updateAccVer } = require("../../../db/account");
const { sendPhoneText } = require("../phone_mgt");

const SERVER_URL =
    process.NODE_ENV === "production" ?
        process.env.SERVER_URL : "http://localhost.com";

let sendMobileSMSToken = async (req, res, next) => {
    try {
        let phonenumToSendToken = req.session.phonenum;
        if (!phonenumToSendToken) {
            console.log("No phone number to send token...");
            return next()
        }
        req.session.factor = "mobile";
        req.session.type = "token_ver";
        req.session.factorValue = phonenumToSendToken;
        req.session.ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
        await saveToken({ ...req.session })
        let msg = `Thanks for registering at Earnable.
        Please verify Your phone number. 
        Token to input: ${req.session.token}.`;
        let mobileRes = await sendPhoneText({
            to: phonenumToSendToken,
            text: msg
        });
        if (!mobileRes) {
            throw "Error sending..."
        }
        next()
    } catch (error) {
        console.log(error);

        throw error
    }
};

let sendPhonePinSMSToken = async (req, res, next) => {
    try {
        let phonenumToSendToken = req.session.phonenum;
        req.session.factor = "phone_pin";
        req.session.type = "token_ver";
        req.session.factorValue = phonenumToSendToken;
        req.session.ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
        await saveToken({ ...req.session });
        let msg = `Thanks for registering at Earnable. Please verify Your phone number. Token to input: ${req.session.token}.`;
        let emailRes = await sendPhoneText({
            to: phonenumToSendToken,
            text: msg
        });
        if (!emailRes) {
            throw "Error sending..."
        }
        next()
    } catch (error) {
        console.log(error);

        throw error
    }
};

module.exports = {sendMobileSMSToken,sendPhonePinSMSToken};
