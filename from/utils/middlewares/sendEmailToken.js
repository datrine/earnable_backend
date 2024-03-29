const { sendEmail } = require("../email_mgt");
const { DateTime } = require("luxon");
const { saveToken } = require("../../../db/token");

const SERVER_URL =
    process.NODE_ENV === "production" ?
        process.env.SERVER_URL : "http://localhost.com";

let sendEmailToken = async (req, res, next) => {
    try {
        let emailToSendToken = req.session.queried.email;

        if (!emailToSendToken) {
            console.log("No Email to send token...");
            return next()
        }
        req.session.queried.factor = "email";
        req.session.queried.type = "token_ver";
        req.session.queried.factorValue = emailToSendToken;
        req.session.queried.ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
        await saveToken({ ...req.session.queried })
        let msg = `Thanks for registering at Earnable.
        Please verify Your email address. 
        Token to input: ${req.session.queried.token}.`

        let emailRes = await sendEmail({
            to: emailToSendToken,
            subject: "Earnable Email Verification",
            html: msg
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

module.exports = sendEmailToken;