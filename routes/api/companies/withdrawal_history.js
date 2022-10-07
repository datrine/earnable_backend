const router = require("express").Router();
const { getEmployeesSumOfWithdrawn } = require("../../../db");
const { getCompanyEmployeesWithdrawalHistory } = require("../../../db/withdrawal");

//user id, email or username

router.use("/", async (req, res, next) => {
    try {
        let { companyID, account } = req.session;
        let filters = req.query;
        let withdrawalHistoryRes = await getCompanyEmployeesWithdrawalHistory({ companyID, filters });
        if (withdrawalHistoryRes.err) {

        }
        let withdrawal_history = withdrawalHistoryRes.withdrawal_history;
        req.session.withdrawal_history = withdrawal_history
        next()
    } catch (error) {
        console.log(error)
    }
});

router.get("/total_withdrawal", async (req, res, next) => {
    try {
        let { filters } = req.session.queried;
        let total_withdrawal =await getEmployeesSumOfWithdrawn({filters})
        console.log(total_withdrawal);
        res.json({ total_withdrawal });
    } catch (error) {
        console.log(error)
    }
});

router.get("/count", async (req, res, next) => {
    try {
        let { withdrawal_history } = req.session;
        res.json({ withdrawal_count:withdrawal_history.length });
    } catch (error) {
        console.log(error)
    }
});

router.get("/", async (req, res, next) => {
    try {
        let { withdrawal_history } = req.session;
        res.json({ withdrawal_history });
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;