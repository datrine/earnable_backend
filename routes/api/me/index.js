const { accountAccIDResetSet, getBiodataFunc } = require("../../../db/account");
const { accTemplate } = require("../../../db/templates");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");

const router = require("express").Router();


router.get("/user", async (req, res, next) => {
    try {
        let account = req.session.account
        let { err, user } = await getBiodataFunc({ email: account.email, accountID: account.accountID })
        if (err) {
            return res.json({ err })
        }
        return res.json({ user, })
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