const router = require("express").Router()
const companyRolesRouter = require("./roles");
const companyEmployeesRouter = require("./employees");
const companyDepartmentsRouter = require("./departments");
const companyTransactionsRouter = require("./transactions");
const companyWithdrawalHistoryRouter = require("./withdrawal_history");
const companyWalletRouter = require("./wallets");
const createCompanyApiRouter = require("./company_new");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");
const { getCompaniesByIDs, getCompanyByID } = require("../../../db/company");
const { getResourcesByAccID } = require("../../../db/resource");
const { getTotalSalaries } = require("../../../db/employee");


router.use("/create", createCompanyApiRouter);

router.use("/", getAuthAccount);

router.get("/list", async (req, res, next) => {
    let { accountID } = req.session.account;
    let resourcesRes = await getResourcesByAccID({ accountID, filterIn: ["company"] });

    let companiesRes = await getCompaniesByIDs({ ids: [...resourcesRes.resources].map(resource => resource.resourceDocID) });
    console.log("companiesRes")
    return res.json(companiesRes)
});

router.use("/:companyID", async (req, res, next) => {
    try {
        let { companyID } = req.params
        let companyRes = await getCompanyByID({ id: companyID });
        if (companyRes?.err) {
            return res.json(companyRes)
        }
        req.session.company = companyRes.company;
        req.session.companyID = companyID;
        next()
    } catch (error) {
        console.log(error);
        res.json({ err: error })
    }
});


router.use("/:companyID/roles", companyRolesRouter);
router.use("/:companyID/employees", companyEmployeesRouter);
router.use("/:companyID/departments", companyDepartmentsRouter);
router.use("/:companyID/transactions", companyTransactionsRouter);
router.use("/:companyID/wallet", companyWalletRouter);
router.use("/:companyID/withdrawal_history", companyWithdrawalHistoryRouter);
router.get("/:companyID/total_salaries", async (req, res, next) => {
    let { companyID } = req.session
    let filters = req.query
    let totalSalaries = await getTotalSalaries({ companyID, filters });
    return res.json(totalSalaries)
});
router.get("/:companyID", async (req, res, next) => {
    let { company } = req.session;
    return res.json({ company })
});

module.exports = router;