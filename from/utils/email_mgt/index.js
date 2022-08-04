let nodemailer = require("nodemailer")
/**
 * 
 * @param {object} data 
 * @param {string} data.from
 * @param {string} data.to
 * @param {string} data.text
 * @param {string} data.html
 * @param {string} data.subject
 */
async function sendEmail(data) {
    try {
        if (!data) {
            throw "Empty data...";
        }
        let { from = "info@datrisoft.com", to, text, html,
            pass = process.env.EMAIL_PASS,
            user = process.env.EMAIL_USER,
            host = process.env.EMAIL_HOST,
            port = process.env.EMAIL_PORT,
            subject } = data;
        console.log("Email host: " + host)
        let transport = nodemailer.createTransport({
            host, port, auth: { user, pass },//secure:true
        });

        let res = await transport.sendMail({
            from,
            to,
            text, html, subject
        });
        return res
    } catch (error) {
        console.log(error);
        return { err: { msg: error } };
    }
}

/**
 * 
 * @param {object} data 
 * @param {string} data.mail_template_key
 * @param {string} data.bounce_address
 * @param {object} data.from
 * @param {string} data.from.name
 * @param {string} data.from.address
 * @param {[{name:string,address:string}]} data.to
 * @param {string} data.htmlbody
 * @param {string} data.subject
 */
async function sendEmailTemplate(data) {
    try {
        if (!data) {
            throw "Empty data...";
        }
        let { mail_template_key,
            bounce_address = "allbounces@bounce.datrisoft.com",
            to, from = "info@datrisoft.com",
            htmlbody } = data
        fetch("https://api.zeptomail.com/v1.1/email", {
            method: "post",
            mode: "cors",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Zoho-enczapikey 
                 wSsVR613rBb4Wvx7njykL+5uzFQEBgmnE0x43gDy436uGKzDocc9kULHBQKlHPNMFzNoEDYT978gzBdS1TRfjdsqwlEEXiiF9mqRe1U4J3x17qnvhDzJWm5UkReKL4wPwAlpmmVoFssr+g==`
            },
            body: JSON.stringify({
                mail_template_key,
                bounce_address,
                to, from, htmlbody
            })
        })
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

let templateKeys = {
    email_verif: "2d6f.685bf0e3b997d070.k1.f0257c80-f541-11eb-9361-52540089b17e.17b1204d448",
    datrisoft_welcome: "2d6f.685bf0e3b997d070.k1.5e36ae80-f4d7-11eb-9361-52540089b17e.17b0f4a6968",

}

module.exports = { sendEmail, sendEmailTemplate }