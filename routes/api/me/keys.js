const { saveKey, getKey } = require("../../../db/keys");

const router = require("express").Router();

router.get("/", async (req, res, next) => {
    try {
        let account = req.session.account
        let resGetKey = await getKey({ accountID: account.accountID })
        if (resGetKey.err) {
            return res.json({ err: resGetKey.err })
        }
        return res.json(resGetKey)
    } catch (error) {
        console.log(error);
    }
});


router.post("/save", async (req, res, next) => {
    try {
        let account = req.session.account
        let keyData = req.body
        let resSaveKey = await saveKey({ accountID: account.accountID, keyData })
        if (resSaveKey.err) {
            return res.json({ err: resSaveKey.err })
        }
        return res.json(resSaveKey)
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