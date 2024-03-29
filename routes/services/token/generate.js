const { sendEmail } = require("../../../from/utils/email_mgt");
const { sendPhoneText } = require("../../../from/utils/phone_mgt/");
const { DateTime } = require("luxon");
const { saveToken } = require("../../../db/token");
const sendEmailToken = require("../../../from/utils/middlewares/sendEmailToken");
const {
  generateToken,
  generatePhonePinToken,
  generateOTPToken,
} = require("../../../from/utils/middlewares/generateTokenMW");
const {
  updateAccVer,
  retrieveAccountInfoByVerSessID,
} = require("../../../db/account");
const {
  sendMobileSMSToken,
  sendPhonePinSMSToken,
} = require("../../../from/utils/middlewares/sendMobileSMSToken");
const { sessConfirmMW } = require("../../../from/utils/middlewares/sessIDMW");
const {
  getAuthAccount,
} = require("../../../from/utils/middlewares/getAuthAccount");
const { sendOTPMW } = require("../../../utils/mymiddleware/sendOTPMW");
let router = require("express").Router();

router.get(
  "/email/verification/:verSessID",
  async (req, res, next) => {
    try {
      let { verSessID } = req.params;
      req.session.queried = { ...req.session.queried };
      if (!verSessID) {
        return res.json({ err: { msg: "No verSessID provided" } });
      }
      let retrieveAccByVerSessIDRes = await retrieveAccountInfoByVerSessID(
        verSessID
      );
      if (retrieveAccByVerSessIDRes.err) {
        return res.json(retrieveAccByVerSessIDRes);
      }

      let { verInfo } = retrieveAccByVerSessIDRes.account;
      let verFactorObj = verInfo.status.find(
        (facObj) => facObj.factor === "email"
      );
      if (!verFactorObj) {
        return res.json({ err: { msg: "Factor is not set to be verified" } });
      }
      if (verFactorObj.isVerified) {
        return res.json({ err: { msg: "Token was already verified..." } });
      }
      if (verFactorObj.tokenSent) {
        //return res.json({ err: { msg: "Token was already sent..." } });
      }

      req.session.account = retrieveAccByVerSessIDRes.account;
      req.session.email = retrieveAccByVerSessIDRes.account.email;
      req.session.verSessID = verSessID;

      req.session.queried.account = retrieveAccByVerSessIDRes.account;
      req.session.queried.email = retrieveAccByVerSessIDRes.account.email;
      req.session.queried.verSessID = verSessID;
      next();
    } catch (error) {
      console.log(error);
    }
  },
  generateToken,
  sendEmailToken,
  async (req, res, next) => {
    try {
      let updateAccRes = await updateAccVer({
        verSessID: req.session.queried.verSessID,
        tokenSent: true,
        factor: "email",
        isVerified: false,
        mode: "start",
      });
      console.log(updateAccRes);
      res.json(updateAccRes);
    } catch (error) {
      console.log(error);
    }
  }
);

router.get(
  "/email/authentication",
  sessConfirmMW,
  generateToken,async(req,res,next)=>{
    req.session.queried={ ...req.session.queried, ...req.session.self };
    next()
  },
  async (req, res, next) => {
    try {
      let emailToSendToken = req.session.queried.account.email;
      if (!emailToSendToken) {
        return res.json({ err: { msg: "Recipient email not indicated" } });
      }
      let msg = `Token to input: ${req.session.queried.token}`;
      let emailRes = await sendEmail({
        to: emailToSendToken,
        subject: "Email Token Authentication",
        html: msg,
      });
      if (!emailRes) {
        throw "Error sending...";
      }
      res.json({ info: emailRes });
      let tokenObj = {};
      tokenObj.token = req.session.queried.token;
      tokenObj.factor = "email";
      tokenObj.type = "token_auth";
      tokenObj.factorValue = emailToSendToken;
      tokenObj.ttl = DateTime.now().plus({ minute: 10 }).toJSDate();
      await saveToken({ ...tokenObj });
    } catch (error) {
      console.log(error);

      return res.json({ err: error });
    }
  }
);

router.get(
  "/mobile/verification/:verSessID",
  generateToken,
  async (req, res, next) => {
    try {
      let { verSessID } = req.params;
      if (!verSessID) {
        return res.json({ err: { msg: "No verSessID provided" } });
      }
      console.log("verSessID....:   " + verSessID);
      let retrieveAccByVerSessIDRes = await retrieveAccountInfoByVerSessID(
        verSessID
      );
      if (retrieveAccByVerSessIDRes.err) {
        return res.json(retrieveAccByVerSessIDRes);
      }
      let { verInfo } = retrieveAccByVerSessIDRes.account;
      let verFactorObj = verInfo.status.find(
        (facObj) => facObj.factor === "mobile"
      );
      if (!verFactorObj) {
        return res.json({ err: { msg: "Factor is not set to be verified" } });
      }
      if (verFactorObj.isVerified) {
        return res.json({
          err: { msg: "Phone number was already verified......" },
        });
      }
      if (verFactorObj.tokenSent) {
       // return res.json({ err: { msg: "Token was already sent......" } });
      }
      req.session.account = retrieveAccByVerSessIDRes.account;
      req.session.phonenum = retrieveAccByVerSessIDRes.account.phonenum;
      console.log(verSessID);
      req.session.verSessID = verSessID;

      req.session.queried.account = retrieveAccByVerSessIDRes.account;
      req.session.queried.phonenum = retrieveAccByVerSessIDRes.account.phonenum;
      console.log(verSessID);
      req.session.queried.verSessID = verSessID;

      next();
    } catch (error) {
      console.log(error);
    }
  },
  generateToken,
  sendMobileSMSToken,
  async (req, res, next) => {
    try {
      let updateAccRes = await updateAccVer({
        verSessID: req.session.queried.verSessID,
        tokenSent: true,
        factor: "mobile",
        isVerified: false,
        mode: "start",
      });
      console.log(updateAccRes);
      res.json(updateAccRes);
    } catch (error) {
      console.log(error);
    }
  }
);

router.get(
  "/mobile/authentication",
  sessConfirmMW,
  generateToken,
  generateToken,async(req,res,next)=>{
    req.session.queried={ ...req.session.queried, ...req.session.self };
    next()
  },
  async (req, res, next) => {
    try {
      let phonenumToSendToken = req.session.self.account.phonenum;
      if (!phonenumToSendToken) {
        return res.json({
          err: { msg: "Recipient phone number not indicated" },
        });
      }
      let msg = `Token to input: ${req.session.queried.token}`;
      let mobileRes = await sendPhoneText({
        to: phonenumToSendToken,
        text: msg,
      });
      if (!mobileRes) {
        throw "Error sending...";
      }
      res.json({ info: mobileRes });
      let tokenObj = {};
      tokenObj.token = req.session.queried.token;
      tokenObj.factor = "mobile";
      tokenObj.type = "token_auth";
      tokenObj.factorValue = phonenumToSendToken;
      tokenObj.ttl = DateTime.now().plus({ minute: 10 }).toJSDate();
      await saveToken({ ...tokenObj });
    } catch (error) {
      console.log(error);
      return res.json({ error });
    }
  }
);

router.get(
  "/phone_pin/verification/:verSessID",
  generateToken,
  async (req, res, next) => {
    try {
      let { verSessID } = req.params;
      if (!verSessID) {
        return res.json({ err: { msg: "No verSessID provided" } });
      }
      let retrieveAccByVerSessIDRes = await retrieveAccountInfoByVerSessID(
        verSessID
      );
      if (retrieveAccByVerSessIDRes.err) {
        return res.json(retrieveAccByVerSessIDRes);
      }
      let { verInfo } = retrieveAccByVerSessIDRes.account;
      let verFactorObj = verInfo.status.find(
        (facObj) => facObj.factor === "phone_pin"
      );
      if (!verFactorObj) {
        return res.json({ err: { msg: "Factor is not set to be verified" } });
      }
      if (verFactorObj.isVerified) {
        return res.json({ err: { msg: "Phone pin was already verified..." } });
      }
      if (verFactorObj.tokenSent) {
        //return res.json({ err: { msg: "Token was already sent......" } });
      }
      req.session.account = retrieveAccByVerSessIDRes.account;
      req.session.phonenum = retrieveAccByVerSessIDRes.account.phonenum;
      req.session.verSessID = verSessID;

      req.session.queried.account = retrieveAccByVerSessIDRes.account;
      req.session.queried.phonenum = retrieveAccByVerSessIDRes.account.phonenum;
      req.session.queried.verSessID = verSessID;
      console.log("Attempting to generate...")
      next();
    } catch (error) {
      console.log(error);
    }
  },
  generatePhonePinToken,
  sendPhonePinSMSToken,
  async (req, res, next) => {
    try {
      let updateAccRes = await updateAccVer({
        verSessID: req.session.verSessID,
        tokenSent: true,
        factor: "phone_pin",
        isVerified: false,
        mode: "start",
      });
      res.json(updateAccRes);
    } catch (error) {
      console.log(error);
    }
  }
);

router.get(
  "/transactions/:transactionID/withdrawal/otp",
  getAuthAccount,
  async (req, res, next) => {
    try {
      req.session.queried = { ...req.session.queried, ...req.session.self };
      next();
    } catch (error) {}
  },
  generateOTPToken,
  sendOTPMW,
  async (req, res, next) => {
    //res.json({ info: emailRes });
    res.json({ info: "OTP sent." });
  }
);

module.exports = router;
