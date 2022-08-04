const { verifyToken, findAndVerifyToken } = require("../../../db/token");
const { updateAccVer, retrieveAccountInfoBasic, mobileFactorDBUpdate, mobileFactorAuth, setDefaultPhonePin } = require("../../../db/account");
const { getRandomToken } = require("../../../from/utils/token_mgt");
const { sendPhoneText } = require("../../../from/utils/phone_mgt");
let router = require("express").Router()

router.post("/email/verification/", async (req, res, next) => {
    try {
        if (!req.body.token)
            throw "Token cannot be empty";
        let tokenToVerify = req.body.token;
        let findVerRes = await findAndVerifyToken({ token: tokenToVerify });
        if (findVerRes.err) {
            return res.json(findVerRes)
        }
        if (findVerRes.tokenDoc.factor !== "email") {
            return res.json({ err: { msg: "Token not appropriate for email factor..." } })
        }
        let email = findVerRes.tokenDoc.factorValue;
        let retrieveAccRes = await retrieveAccountInfoBasic({ identifier: email });
        if (retrieveAccRes.err) {
            return res.json(retrieveAccRes)
        }
        req.session.account = retrieveAccRes.account
        req.session.email = retrieveAccRes.account.email
        req.session.verSessID = retrieveAccRes.account.verInfo.verSessID
        let updateAccVerRes = await updateAccVer({
            verSessID: req.session.verSessID,
            factor: "email", tokenSent: true,
            isVerified: true, mode: "update"
        });
        res.json(updateAccVerRes)

    } catch (error) {
        console.log(error);
        return res.json({ err: error })
    }
});

router.post("/mobile/verification/", async (req, res, next) => {
    try {
        if (!req.body.token)
            throw "Token cannot be empty";
        let tokenToVerify = req.body.token;
        let findVerRes = await
            findAndVerifyToken({ token: tokenToVerify });
        if (findVerRes.err) {
            return res.json(findVerRes)
        }
        if (findVerRes.tokenDoc.factor !== "mobile") {
            return res.json({ err: { msg: "Token not appropriate for mobile factor..." } })
        }
        let phonenum = findVerRes.tokenDoc.factorValue;
        let retrieveAccRes = await
            retrieveAccountInfoBasic({ identifier: phonenum });
        if (retrieveAccRes.err) {
            return res.json(retrieveAccRes)
        }
        req.session.account = retrieveAccRes.account
        req.session.phonenum = retrieveAccRes.account.phonenum
        req.session.verSessID = retrieveAccRes.account.verInfo.verSessID
        let updateAccVerRes = await updateAccVer({
            verSessID: req.session.verSessID,
            factor: "mobile", tokenSent: true,
            isVerified: true, mode: "update"
        });
        res.json(updateAccVerRes)

    } catch (error) {
        console.log(error);
        return res.json({ err: error })
    }
});

router.post("/phone_pin/verification/", async (req, res, next) => {
    try {
        if (!req.body.token)
            throw "Token cannot be empty";
        let tokenToVerify = req.body.token;
        let findVerRes = await findAndVerifyToken({ token: tokenToVerify });
        if (findVerRes.err) {
            return res.json(findVerRes)
        }
        if (findVerRes.tokenDoc.factor !== "phone_pin") {
            return res.json({ err: { msg: "Token not appropriate for phone pin factor..." } })
        }
        let phonenum = findVerRes.tokenDoc.factorValue;
        let retrieveAccRes = await retrieveAccountInfoBasic({ identifier: phonenum });
        if (retrieveAccRes.err) {
            return res.json(retrieveAccRes)
        }
        req.session.account = retrieveAccRes.account
        req.session.phonenum = retrieveAccRes.account.phonenum
        req.session.verSessID = retrieveAccRes.account.verInfo.verSessID
        let updateAccVerRes = await updateAccVer({
            verSessID: req.session.verSessID,
            factor: "phone_pin", tokenSent: true,
            isVerified: true, mode: "update"
        });
        let phonePin = getRandomToken({ minLength: 4 });
        let defaultRes = await setDefaultPhonePin({ phonenum: req.session.phonenum, phonePin });
        
        sendPhoneText({ to: req.session.phonenum, text: `Your default password: ${phonePin}` }).
        then(res => {
            console.log(res)
        });
        res.json({ ...updateAccVerRes, ...defaultRes })

    } catch (error) {
        console.log(error);
        return res.json({ err: error })
    }
});

router.post("/mobile", async (req, res, next) => {
    try {
        if (!req.body)
            throw "request body is empty";
        let mobileToSendToken = (req.user && req.user.email) || req.body.email;
        let tokenToVerify = req.body.token;
        let verified = await verifyToken({ token: tokenToVerify })
        res.json({ verified })
    } catch (error) {
        console.log(error);
        return res.json({ error })
    }
});

router.post("/email", async (req, res, next) => {
    try {
        if (!req.body)
            throw "request body is empty";
        let emailToSendToken = (req.user && req.user.email) || req.body.email;
        let tokenToVerify = req.body.token;
        let verified = await verifyToken({ token: tokenToVerify })
        res.json({ verified })
    } catch (error) {
        console.log(error);
        return res.json({ error })
    }
});

module.exports = router;