const router = require("express").Router()
const companyRolesRouter = require("./roles");
const companyEmployeesRouter = require("./employees");
const companyDepartmentsRouter = require("./departments");
const companyAdminsRouter = require("./admins");
const companyTransactionsRouter = require("./transactions");
const calculationsRouter = require("../calculations");
const companyWithdrawalHistoryRouter = require("./withdrawal_history");
const companyWalletRouter = require("./wallets");

router.use("/", async(req,res,next)=>{
    next()
});

router.use("/roles", companyRolesRouter);

router.use("/employees", companyEmployeesRouter);

router.use("/departments", companyDepartmentsRouter);

router.use("/transactions", companyTransactionsRouter);

router.use("/wallet", companyWalletRouter);

router.use("/withdrawal_history", companyWithdrawalHistoryRouter);

router.use("/admins", companyAdminsRouter);

router.use("/calculations",async(req,res,next)=>{
    let companyID=req.session.queried.companyID
    let filters={companyID};
    req.session.queried.filters=filters
    next()
},calculationsRouter);

router.get("/", async (req, res, next) => {
    let { company } = req.session.queried;
    return res.json({ company })
});
module.exports = router;