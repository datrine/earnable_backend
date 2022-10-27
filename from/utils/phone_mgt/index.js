const TERMII = require('../../../termii/sendSMS');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

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
        
        let res=await TERMII.sendSMS({to:data.to,sms:data.text});
        console.log(res)

        return { info: "SMS sent" }
    } catch (error) {
        console.log(error);
        return { err: { msg: error } };
    }
}


module.exports = { sendPhoneText, }