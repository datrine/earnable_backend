const { DateTime } = require("luxon");
const { saveToken } = require("../../../db/token");
const { sendPhoneText } = require("../phone_mgt");

const SERVER_URL =
    process.NODE_ENV === "production" ?
        process.env.SERVER_URL : "http://localhost.com";

let sendMobileSMSToken = async (req, res, next) => {
    try {
        let phonenumToSendToken = req.session.queried.phonenum;
        if (!phonenumToSendToken) {
            console.log("No phone number to send token...");
            return next()
        }

        let factor = "mobile";
        let type = "token_ver";
        let factorValue = phonenumToSendToken;
        let ttl = DateTime.now().plus({ minute: 10 }).toJSDate()

        req.session.factor =factor
        req.session.type = type
        req.session.factorValue =factorValue
        req.session.ttl =ttl

        req.session.queried.factor =factor
        req.session.queried.type = type
        req.session.queried.factorValue = factorValue;
        req.session.queried.ttl = ttl
        await saveToken({ ...req.session.queried })
        let msg = `Please verify Your phone number. 
        Token to input: ${req.session.queried.token}.`;
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
        let phonenumToSendToken = req.session.phonenum.queried;

        req.session.factor = "phone_pin";
        req.session.type = "token_ver";
        req.session.factorValue = phonenumToSendToken;
        req.session.ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
        
        req.session.queried.factor = "phone_pin";
        req.session.queried.type = "token_ver";
        req.session.queried.factorValue = phonenumToSendToken;
        req.session.queried.ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
        await saveToken({ ...req.session.queried });
        let msg = `Thanks for registering at Earnable. Please verify Your phone number. Token to input: ${req.session.queried.token}.`;
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
