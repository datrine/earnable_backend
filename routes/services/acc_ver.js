const { retrieveAccountInfoByVerSessID } = require("../../db/account");
const { generateToken } = require("../../from/utils/middlewares/generateTokenMW");
const sendEmailToken = require("../../from/utils/middlewares/sendEmailToken");

const router = require("express").Router();

router.use("/:verSessID/status/", async (req, res, next) => {
    try {
        let { verSessID } = req.params
        console.log(verSessID)
        let allResponses = await
            retrieveAccountInfoByVerSessID(verSessID);
            console.log(allResponses)
        let { err, ...rest } = allResponses;
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        req.session.account = rest.account
        next()
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.get("/:verSessID/status/verInfo", async (req, res, next) => {
    try {
        let { verInfo } = req.session.account
        res.json({ ...verInfo })

    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.get("/:verSessID/status/phonenum", async (req, res, next) => {
    try {
        let { phonenum } = req.session.account
        res.json({ phonenum })

    } catch (error) {
        console.log(error);
        next("Server error")
    }
});


router.get("/:verSessID/status/email", async (req, res, next) => {
    try {
        let {email } = req.session.account
        res.json({ email })

    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

module.exports = router