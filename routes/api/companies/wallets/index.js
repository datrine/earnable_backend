const router = require("express").Router()
const {  getWalletByCompanyID, getOrCreateCompanyWallet, } = require("../../../../db/wallet");

router.post("/create", async (req, res, next) => {
    try {
        let { companyID, account } = req.session;
        let {err, walletID } = await getOrCreateCompanyWallet({ companyID, creatorMeta: { id: account.accountID } });
        return {walletID}
    } catch (error) {
        console.log(error)
    }
});

router.put("/fund", async (req, res, next) => {
    try {
        let { companyID, account } = req.session;
        let data = req.body
    } catch (error) {
        console.log(error)
    }
});

router.use("/", async (req, res, next) => {
    try {
        let { companyID } = req.session;
        let { wallet } = await getWalletByCompanyID( companyID);
        req.session.wallet = wallet
        next()
    } catch (error) {
        console.log(error)
    }
});

router.get("/balance", async (req, res, next) => {
    try {
        let { wallet } = req.session;

        res.json({ balance:wallet.balance })
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