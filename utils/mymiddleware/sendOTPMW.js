const { DateTime } = require("luxon");
const { saveOTPToken } = require("../../db/otp_token");
const { sendEmail } = require("../../from/utils/email_mgt");

let sendOTPMW = async (req, res, next) => {
    try {
        let emailToSendToken = req.session?.account?.email;

        if (!emailToSendToken) {
            console.log("No Email to send token...");
            return res.json({ err: { msg: "Unable to generate OTP" } })
        }
        req.session.accountID=req.session.account.accountID
        req.session.platforms = ["email", "mobile"];
        req.session.type = "otp";
        req.session.ttl = DateTime.now().plus({ minute: 10 }).toJSDate();
        await saveOTPToken({ ...req.session })
        let msg = `Token to input: ${req.session.otp}.`

        let emailRes = await sendEmail({
            to: emailToSendToken,
            subject: "Earnable OTP",
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
}

module.exports = { sendOTPMW }