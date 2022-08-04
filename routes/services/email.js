let nodemailer = require("nodemailer");
const { sendEmail } = require("../../from/utils/email_mgt");
let router = require("express").Router()

router.post("/send/testing", async (req, res, next) => {
    try {
        if (!req.body) {
            return;
        }
        console.log("Email host: " + req.body.host);
        await sendEmail(req.body);
    } catch (error) {
        console.log(error);
    }
});

router.post("/send", async (req, res, next) => {
    try {
        if (!req.body) {
            return;
        }
        console.log("Email host: " + req.body.host);
        await sendEmail(req.body);
    } catch (error) {
        console.log(error);
    }
});


module.exports = router;