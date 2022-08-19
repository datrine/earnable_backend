const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const companyRolesRouter = require("./roles");
const companyEmployeesRouter = require("./employees");
const companyDepartmentsRouter = require("./departments");
const companyTransactionsRouter = require("./transactions");
const companyWalletRouter = require("./wallets");
const companyApiProperRouter = require("./company_new");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");
const { getCompaniesByIDs, getCompanyByID } = require("../../../db/company");
const {  getResourcesByAccID } = require("../../../db/resource");
const { getTotalSalaries } = require("../../../db/employee");

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
        if (companyRes.err) {
            return res.json(companyRes)
        }
        req.session.company = companyRes.company;
        req.session.companyID = companyID;
        next()
    } catch (error) {
        console.log(error)
    }
});


router.use("/:companyID/roles",companyRolesRouter);
router.use("/:companyID/employees",companyEmployeesRouter);
router.use("/:companyID/departments",companyDepartmentsRouter);
router.use("/:companyID/transactions",companyTransactionsRouter);
router.use("/:companyID/wallet",companyWalletRouter);

router.get("/:companyID/total_salaries",async (req, res, next) => {
    let {companyID}=req.session
    let totalSalaries=await getTotalSalaries({companyID});
    return res.json(totalSalaries)
});

router.get("/:companyID", async (req, res, next) => {
    let { company } = req.session;
    return res.json({ company })
});


router.use("/", companyApiProperRouter);


module.exports = router;