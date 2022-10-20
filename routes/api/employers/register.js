const { registerFunc } = require("../../../db/register");
const { sendEmail } = require("../../../from/utils/email_mgt");
const router = require("express").Router();
const { generateToken } = require("../../../from/utils/middlewares/generateTokenMW");
const sendEmailToken = require("../../../from/utils/middlewares/sendEmailToken");
const { sendPhoneText } = require("../../../from/utils/phone_mgt");

router.post("/local", async (req, res, next) => {
    try {
        let prof_pic = req.files && req.files.prof_pic
        let data = req.body;
        let allResponses = await registerFunc({ ...data, prof_pic });
        let { err, ...rest } = allResponses;
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        sendEmail({
            subject: "Welcome To Earnable",
            to: data.email,
            html:
                `<p>Welcome to Earnable.
             We hope you enjoy your time here</p>`
        }).catch(err => { console.log(err) });
        if (data.phonenum) {
            sendPhoneText({ to: data.phonenum, text: `Welcome to Earnable` }).
                then(res => {
                    console.log(res)
                }).catch(console.log)
        }
        res.json({ ...rest })
        req.session.queried={...req.session.queried}
        req.session.email = req.body.email
        req.session.queried.email = req.body.email
        next()
        /*let responseFromServer = await axios.post(`${AUTH_SERVER}/api/register/local`, { ...req.body });
        let data = responseFromServer.data
        return res.json(data)*/
    } catch (error) {
        console.log(error);
        next("Server error")
    }
}, generateToken, sendEmailToken, async (req, res, next) => {
    try {
        console.log({ info: "Email sent..." })
    } catch (error) {
        console.log(error);
        next("Server error")
    }
})
module.exports = router;