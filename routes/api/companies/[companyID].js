const router = require("express").Router()
const companyRolesRouter = require("./roles");
const companyEmployeesRouter = require("../employees");
const companyDepartmentsRouter = require("./departments");
const companyAdminsRouter = require("./admins");
const companyTransactionsRouter = require("../transactions");
const calculationsRouter = require("../calculations");
const companyWithdrawalHistoryRouter = require("./withdrawal_history");
const companyWalletRouter = require("./wallets");
const { getEmployeesByCompanyID } = require("../../../db/employee");

router.use("/roles", companyRolesRouter);

router.use("/employees", async (req, res, next) => {
    try {
        let { companyID } = req.session.queried
        let filters = req.query
        filters.companyID=companyID;
        let rolesRes = await getEmployeesByCompanyID({ companyID,filters });
        if (rolesRes.err) {
            return res.json(rolesRes)
        }
        req.session.queried.employees = rolesRes.employees;
        next()
    } catch (error) {
        console.log(error)
    }
  }, companyEmployeesRouter);

router.use("/departments", companyDepartmentsRouter);

router.use("/transactions", companyTransactionsRouter);

router.use("/wallet", companyWalletRouter);

router.use("/withdrawal_history", companyWithdrawalHistoryRouter);

router.use("/admins", companyAdminsRouter);

router.use("/calculations",calculationsRouter);


router.get("/", async (req, res, next) => {
    let { company } = req.session.queried;
    return res.json({ company })
});
module.exports = router;