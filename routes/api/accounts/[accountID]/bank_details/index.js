const router = require("express").Router();
const { getBankDetailsByAccountID, updateBankDetailsByAccountID } = require("../../../../../db/bank_detail");

router.put("/upsert", async (req, res, next) => {
    try {
        let {paramAccountID  } = req.session.queried
        let updates = req.body
        let employeeRes = await updateBankDetailsByAccountID({ accountID: paramAccountID,...updates });
        return res.json({ ...employeeRes })
    } catch (error) {
        console.log(error);
        res.json({err:error});
    }
});

router.get("/", async (req, res, next) => {
    try {
        let { paramAccountID } = req.session.queried

        let bankDetailsRes = await getBankDetailsByAccountID({ accountID: paramAccountID });
        return res.json({ ...bankDetailsRes })
    } catch (error) {
        console.log(error)
    }
});
module.exports = router;