const router = require("express").Router();
const {
  canAddEmployeeMW,
} = require("../../../utils/mymiddleware/products/canCreateProductMW");
const { ObjectId } = require("bson");
const sessIDVerifyMW = require("../../../utils/mymiddleware/sessIDVerifyMW");
const { registerEmployeeFunc } = require("../../../db/register");
const { sendEmail } = require("../../../from/utils/email_mgt");
const { sendPhoneText } = require("../../../from/utils/phone_mgt");
const {
  generateToken,
  generatePhonePinToken,
} = require("../../../from/utils/middlewares/generateTokenMW");
const sendEmailToken = require("../../../from/utils/middlewares/sendEmailToken");
const {
  sendPhonePinSMSToken,
} = require("../../../from/utils/middlewares/sendMobileSMSToken");
const { getRandomToken } = require("../../../from/utils/token_mgt");
const { saveToken } = require("../../../db/token");
const { DateTime } = require("luxon");
const frontend_url = process.env.FRONTEND_URL;

router.put(
  "/",
  sessIDVerifyMW,
  canAddEmployeeMW,
  async (req, res, next) => {
    try {
      res.status(400);
      let { employeeToSave, account, company } = req.session.queried;
      let data = employeeToSave;
      employeeToSave.companyID = employeeToSave.companyID;
      employeeToSave.creatorMeta = {
        _id: ObjectId(account._id),
        email: account.email,
        accountID: account.accountID,
      };
      let allResponses = await registerEmployeeFunc({ ...data });

      let { err, ...rest } = allResponses;
      if (err) {
        res.status = 400;
        return res.json({ err });
      }
      let employeeVerSessID = allResponses.verSessID;
      let token = getRandomToken({ minLength: 4 });
      let ttl = DateTime.now().plus({ minute: 10 }).toJSDate();
      saveToken({
        token,
        factor: "phone_pin",
        type: "token_ver",
        factorValue: data.phonenum,
        ttl,
      })
        .then(console.log)
        .catch(console.log);

      if (data.email) {
        let { company_name } = company;
        sendEmail({
          subject: "Welcome To Earnable",
          to: data.email,
          html: `<h3>Welcome to Earnable</h3>.
            <p>Your employer, ${company_name}, has registered you at Earnable. We hope you enjoy your time here. You can activate your account 
           <strong> <a href='${frontend_url}/employee/register?verSessID=${employeeVerSessID}'>here</a></strong>. Your verification session ID, verSessID, is <strong> ${employeeVerSessID}</strong>. Your Mobile OTP is ${token}.</p>`,
        }).catch((err) => {
          console.log(err);
        });
      }

      if (data.phonenum) {
        sendPhoneText({
          to: data.phonenum,
          text: `Welcome to Earnable. VerSessID: <strong> ${employeeVerSessID} </strong> . Your mobile OTP is ${token}.`,
        })
          .then((res) => {
            console.log(res);
          })
          .catch(console.log);
      }
      res.statusCode = 201;
      res.json({ ...rest });
      let { email, phonenum } = employeeToSave;
      console.log({ email, phonenum });
      req.session.queried = { ...req.session.queried, email, phonenum };
      req.session.email = email;
      req.session.phonenum = phonenum;
      next();
    } catch (error) {
      res.status(500);
      console.log(error);
      res.json({ err: error });
    }
  },
  generateToken,
  sendEmailToken,
  generatePhonePinToken,
  sendPhonePinSMSToken,
  async (req, res, next) => {
    try {
      console.log({ info: "Email sent..." });
    } catch (error) {
      console.log(error);
      next("Server error");
    }
  }
);

module.exports = router;
