/**
 * @type {import("isomorphic-unfetch").default}
 */
const fetch = require('isomorphic-unfetch');

let sendSMS = async ({ to, from = "MINICHAT", sms, type = "plain", channel="generic" }) => {

    try {
        let termiiAPIKey = process.env.TERMII_API_KEY;
        let response = await fetch("https://api.ng.termii.com/api/sms/send", {
            mode: "cors",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ to, from, sms, type, api_key: termiiAPIKey,channel })
        });
        if (!response.ok) {
            throw await response.text()
        }
        let data =await response.json();
        if (!data?.message_id) {
            throw { err: { msg: "Unable to send." } }
        }
        return {info:"Termii sent msg",...data}
    } catch (error) {
        console.log(error);
        throw  error
    }
}

let TERMII = { sendSMS }
module.exports = TERMII