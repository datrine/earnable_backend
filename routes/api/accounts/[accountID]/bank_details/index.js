const router = require("express").Router();
const { getAuthAccount } = require("../../../../../from/utils/middlewares/getAuthAccount");
const { accountLogOut, getUserInfo,updateAccInfo } = require("../../../../../db/account");
const { getEmployeeByAccountID } = require("../../../../../db/employee");
const { getBankDetailsByAccountID, updateBankDetailsByAccountID } = require("../../../../../db/bank_detail");

router.put("/upsert", async (req, res, next) => {
    try {
        let {paramAccountID  } = req.session
        let updates = req.body
        console.log(updates)
        let employeeRes = await updateBankDetailsByAccountID({ accountID: paramAccountID,...updates });
        return res.json({ ...employeeRes })
    } catch (error) {
        console.log(error);
        res.json({err:error});
    }
});


router.get("/", async (req, res, next) => {
    try {
        let { paramAccountID } = req.session

        let bankDetailsRes = await getBankDetailsByAccountID({ accountID: paramAccountID });
        return res.json({ ...bankDetailsRes })
    } catch (error) {
        console.log(error)
    }
});

router.get("/", (req, res, next) => {

    return res.json([])
});

router.use("/logout", getAuthAccount, async (req, res, next) => {
    try {
        let { sessID } = req.session
        let resLogOut = await accountLogOut({ sessID });
        console.log(resLogOut)
        res.json(resLogOut)
    } catch (error) {

    }
});

module.exports = router;