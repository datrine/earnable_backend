const {retrieveAccountInfoBySessID } = require("../../../db/account");

const router = require("express").Router();

router.use("/", async (req, res, next) => {
    try {
        let sessID = req.headers.authorization?.split(" ")[1];
        if (!sessID) {
            return res.json({
                err: {
                    msg: "No bearer token added",
                    type: "no_auth_token"
                }
            })
        }
        let { err, account } = await retrieveAccountInfoBySessID(sessID)
        if (err) {
            return res.json({ err })
        }
        req.session.sessID = sessID
        req.session.account = account
        next()
    } catch (error) {
        console.log(error);
        next(error)
    }
});

router.get("/verSessID", async (req, res, next) => {
    try {
        let account = req.session.account
        let verSessID = account.verInfo?.verSessID
        return res.json({ verSessID })
    } catch (error) {
        console.log(error);
    }
});

router.get("/", async (req, res, next) => {
    try {
        let account = req.session.account
        return res.json({ account, })
    } catch (error) {
        console.log(error);
    }
});

module.exports = router