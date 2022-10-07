const router = require("express").Router()
const {  getOrCreateCompanyWallet, } = require("../../../../db/wallet");

router.post("/create", async (req, res, next) => {
    try {
        let { companyID, account } = req.session;
        let {err, walletID } = await getOrCreateCompanyWallet({ companyID, creatorMeta: { id: account.accountID } });
        return {walletID}
    } catch (error) {
        console.log(error)
    }
});

router.get("/balance", async (req, res, next) => {
    try {
        let { wallet } = req.session;

        res.json({ balance:wallet?.balance })
    } catch (error) {
        console.log(error)
    }
});

router.get("/", async (req, res, next) => {
    try {
        let { wallet } = req.session;
        res.json({ wallet })
    } catch (error) {
        console.log(error)
    }
});


module.exports = router;