const { DateTime } = require("luxon");
const { saveOTPToken } = require("../../db/otp_token");
const { sendEmail } = require("../../from/utils/email_mgt");
const { sendPhoneText } = require("../../from/utils/phone_mgt");

let sendOTPMW = async (req, res, next) => {
  try {
    let { email: emailToSendToken, phonenum: phonenumToSendToken } =
      req.session?.queried?.account;
    //req.session.queried.accountID=req.session?.queried?.account||req.session.account.accountID
    req.session.queried.platforms = ["email", "mobile"];
    req.session.queried.type = "otp";
    req.session.queried.ttl = DateTime.now().plus({ minute: 10 }).toJSDate();
    await saveOTPToken({ ...req.session.queried });
    let msg = `OTP Token to input: ${req.session.queried.otp}.`;

    let emailRes = await sendEmail({
      to: emailToSendToken,
      subject: "Earnable OTP",
      html: msg,
    });
    if (!emailRes) {
      throw "Error sending...";
    }
    sendPhoneText({ to: phonenumToSendToken, text: msg })
      .then(console.log)
      .catch(console.log);
    next();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = { sendOTPMW };
