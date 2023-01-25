const TERMII = require("../../../termii/sendSMS");
const axios = require("axios").default;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

/**
 *
 * @param {object} data
 * @param {string|[string]} data.to
 * @param {string} data.text
 */
async function sendPhoneText(data) {
  try {
    if (!data) {
      throw "Empty data...";
    }
    console.log(`Sending sms to ${data.to}`);
    let res = await sendViaTERMII({ sms: data.text, to: data.to });
    //let res = await sendViaSMS77io({ ...data });
    if (res.err) {
      throw res;
    }
    console.info({ res });

    return { info: "SMS sent" };
  } catch (error) {
    console.log(error);
    return { err: { msg: error } };
  }
}

/**
 *
 * @param {object} data
 * @param {string|[string]} data.to
 * @param {string} data.sms
 */
async function sendViaTERMII({ to, sms }) {
  try {
    let res = await TERMII.sendSMS({ to, sms });

    return res;
  } catch (error) {
    console.log(error);
    return { err: { msg: error } };
  }
}

/**
 *
 * @param {object} data
 * @param {string|[string]} data.to
 * @param {string} data.text
 */
async function sendViaSMS77io({ to, text }) {
  try {
    const SMS77IO_API_KEY = process.env.SMS77IO_API_KEY;
    const X_RAPID_API_KEY = process.env.X_RAPID_API_KEY;
    const encodedParams = new URLSearchParams();
    encodedParams.append("to", to);
    encodedParams.append("p", SMS77IO_API_KEY);
    encodedParams.append("text", text);
    //encodedParams.append("performance_tracking", "1");
    encodedParams.append("return_msg_id", "1");
    //encodedParams.append("json", "1");

    const options = {
      method: "POST",
      url: "https://sms77io.p.rapidapi.com/sms",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "X-RapidAPI-Key": X_RAPID_API_KEY,
        "X-RapidAPI-Host": "sms77io.p.rapidapi.com",
      },
      data: encodedParams,
    };
    let { data } = await axios.request(options);
    return data;
  } catch (error) {
    console.log(error);
    return { err: { msg: error } };
  }
}
module.exports = { sendPhoneText };
