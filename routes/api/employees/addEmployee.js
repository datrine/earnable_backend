const router = require("express").Router()
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const { getAccountMW } = require("../../../utils/mymiddleware/accounts");
const { canAddEmployeeMW } = require("../../../utils/mymiddleware/products/canCreateProductMW");
const { ObjectId } = require("bson");
const sessIDVerifyMW = require("../../../utils/mymiddleware/sessIDVerifyMW");
const { registerEmployeeFunc } = require("../../../db/register");
const { sendEmail } = require("../../../from/utils/email_mgt");
const { sendPhoneText } = require("../../../from/utils/phone_mgt");
const { generateMobileToken, generateToken, generatePhonePinToken } = require("../../../from/utils/middlewares/generateTokenMW");
const sendEmailToken = require("../../../from/utils/middlewares/sendEmailToken");
const { sendPhonePinSMSToken } = require("../../../from/utils/middlewares/sendMobileSMSToken");

router.put("/", sessIDVerifyMW, canAddEmployeeMW, async (req, res, next) => {
    try {
        res.status(400);
        let account = req.session.account;
        let { employeeToSave } = req
        employeeToSave.companyID = ObjectId(employeeToSave.companyID);
        employeeToSave.creatorMeta = {
            _id: ObjectId(account._id),
            email: account.email,
            accountID: account.accountID
        }
        let data = employeeToSave;
        let allResponses = await registerEmployeeFunc({ ...data });

        let { err, ...rest } = allResponses;
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        if (data.email) {
            sendEmail({
                subject: "Welcome To Earnable",
                to: data.email,
                html:
                    `<p>Welcome to Earnable.
             We hope you enjoy your time here</p>`
            }).catch(err => { console.log(err) });
        }

        if (data.phonenum) {
            sendPhoneText({ to: data.phonenum, text: `Welcome to Earnable` }).
                then(res => {
                    console.log(res)
                })
        }
        res.json({ ...rest });
        req.session.email = req.body.email
        req.session.phonenum = req.body.phonenum;
        next()

    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
}, generateToken, sendEmailToken, generatePhonePinToken, sendPhonePinSMSToken, async (req, res, next) => {
    try {
        console.log({ info: "Email sent..." })
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.get("/my_products", tokenVerifyMW, getAccountMW, (req, res, next) => {

    return res.json()
});

module.exports = router;