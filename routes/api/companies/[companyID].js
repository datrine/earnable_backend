const router = require("express").Router()
const companyRolesRouter = require("./roles");
const companyEmployeesRouter = require("../employees");
const companyDepartmentsRouter = require("./departments");
const companyAdminsRouter = require("./admins");
const companyTransactionsRouter = require("../transactions");
const companyCalculationsRouter = require("../calculations");
const settingsRouter = require("./settings");
const companyWithdrawalHistoryRouter = require("./withdrawal_history");
const companyWalletRouter = require("../wallets");
const { getEmployeesByCompanyID } = require("../../../db/employee");
const { setCompanySalaryDate, checkCompanyStatus } = require("../../../db/company");

router.use("/roles", companyRolesRouter, async (req, res, next) => {
    try {
        next()
    } catch (error) {
        console.log(error)
    }
  },);

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

router.use("/calculations",companyCalculationsRouter);

router.use("/settings",settingsRouter);

router.put("/change_salary_date", async (req, res, next) => {
    let { companyID } = req.session.queried;
    let { salary_date } = req.body;
   let setCompanySalaryDateRes=await setCompanySalaryDate({companyID,salary_date});
   console.log(setCompanySalaryDateRes)
    return res.json(setCompanySalaryDateRes)
});

router.get("/", async (req, res, next) => {
    let { company } = req.session.queried;
    return res.json({ company })
});

module.exports = router;