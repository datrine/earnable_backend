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
const { getRandomToken } = require("../../../from/utils/token_mgt");
const { saveToken } = require("../../../db/token");
const { DateTime } = require("luxon");
const frontend_url = process.env.FRONTEND_URL

router.put("/", sessIDVerifyMW, canAddEmployeeMW, async (req, res, next) => {
    try {
        res.status(400);
        let { employeeToSave, account, company } = req.session
        let data = employeeToSave;
        employeeToSave.companyID = employeeToSave.companyID;
        employeeToSave.creatorMeta = {
            _id: ObjectId(account._id),
            email: account.email,
            accountID: account.accountID
        }
        let allResponses = await registerEmployeeFunc({ ...data });

        let { err, ...rest } = allResponses;
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        let employeeVerSessID = allResponses.verSessID
        let token = getRandomToken({ minLength: 4 });
        let ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
        saveToken({ token, factor: "phone_pin", type: "token_ver", factorValue: data.phonenum, ttl });

        if (data.email) {
            let { company_name } = company
            sendEmail({
                subject: "Welcome To Earnable",
                to: data.email,
                html:
                    `<h3>Welcome to Earnable</h3>.
            <p>Your employer, ${company_name}, has registered you at Earnable. We hope you enjoy your time here. You can activate your account 
            <a href='${frontend_url}/employee/register?verSessID=${employeeVerSessID}'>here</a>. Your OTP is ${token}.</p>`
            }).catch(err => { console.log(err) });
        }

        if (data.phonenum) {
            sendPhoneText({ to: data.phonenum, text: `Welcome to Earnable` }).
                then(res => {
                    console.log(res)
                })
        }
        res.statusCode = 201;
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