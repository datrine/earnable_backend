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
        let res = await client.messages
            .create({
                body: data.text,
                from: '+16072845454',
                to: data.to
            })
        //.then(message => console.log(message.sid));
        console.log(res.sid)

        return { info: "SMS sent" }
    } catch (error) {
        console.log(error);
        return { err: { msg: error } };
    }
}


module.exports = { sendPhoneText, }