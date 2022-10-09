const router = require("express").Router();
const { getEmployeesSumOfWithdrawn } = require("../../db");
const { getTotalFlexibleAccess, getTotalNetPay,getEmployeeNetEarning } = require("../../db/calculations");
const { getTotalSalaries, } = require("../../db/employee");

//user id, email or username

router.use("/", async (req, res, next) => {
    try {
        next()
    } catch (error) {
        console.log(error)
    }
});

router.get("/total_withdrawal", async (req, res, next) => {
    try {
        let { filters } = req.session.queried;
        let total_withdrawal =await getEmployeesSumOfWithdrawn({filters})
        res.json( total_withdrawal);
    } catch (error) {
        console.log(error)
    }
});

router.get("/total_flexible_access", async (req, res, next) => {
    try {
        let { filters } = req.session.queried;
        let totalFlexibleAccess =await getTotalFlexibleAccess({filters})
        res.json( totalFlexibleAccess);
    } catch (error) {
        console.log(error)
    }
});

router.get("/total_net_pay", async (req, res, next) => {
    try {
        let { filters } = req.session.queried;
        let total_withdrawal =await getTotalNetPay({filters});
        res.json( total_withdrawal);
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

router.get("/total_salaries", async (req, res, next) => {
    let { companyID } = req.session
    let filters = req.query
    let totalSalaries = await getTotalSalaries({ companyID, filters });
    return res.json(totalSalaries)
});

router.get("/employee_net_earnings", async (req, res, next) => {
    let { employeeID,} = req.session.queried;

    if (!employeeID) {
        return res.json({err:{msg:"Employee ID not supplied..."}})
    }
    let filters = req.query
    let totalSalaries = await getEmployeeNetEarning({ filters:{...filters,employeeID} });
    return res.json(totalSalaries)
});

router.get("/employees_flexible_access_list", async (req, res, next) => {
    let { employeeID,} = req.session.queried;

    if (!employeeID) {
        return res.json({err:{msg:"Employee ID not supplied..."}})
    }
    let filters = req.query
    let totalSalaries = await getEmployeeNetEarning({ filters:{...filters,employeeID} });
    return res.json(totalSalaries)
});

module.exports = router;