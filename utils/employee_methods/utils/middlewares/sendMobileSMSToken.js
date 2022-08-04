let nodemailer = require("nodemailer");
const { getRandomToken } = require("../token_mgt");
const { sendEmail } = require("../email_mgt");
const { DateTime } = require("luxon");
const { saveToken } = require("../../db/token");
const { updateAccVer } = require("../../db/account");
const { sendPhoneText } = require("../phone_mgt");
let router = require("express").Router()
sendPhoneText
const SERVER_URL =
    process.NODE_ENV === "production" ?
        process.env.SERVER_URL : "http://localhost.com";

let sendMobileSMSToken = async (req, res, next) => {
    try {
        let phonenumToSendToken = req.session.phonenum;
        req.session.factor = "mobile";
        req.session.type = "token_ver";
        req.session.factorValue = phonenumToSendToken;
        req.session.ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
        await saveToken({ ...req.session })
        let msg = `Thanks for registering at Mini_Chat.
        Please verify Your phone number. 
        Token to input: ${req.session.token}.`
console.log("ppppppppppp")
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

module.exports = sendMobileSMSToken;