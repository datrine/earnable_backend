const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const companyRolesRouter = require("./roles");
const companyApiProperRouter = require("./company_new");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");
const { getCompaniesByIDs, getCompanyByID } = require("../../../db/company");
const {  getResourcesByAccID } = require("../../../db/resource");
const companiesCol = waleprjDB.collection("companies")

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
        console.log(companyID)
        let companyRes = await getCompanyByID({ id: companyID });
        if (companyRes.err) {
            return res.json(companyRes)
        }
        req.session.company = companyRes.company;
        next()
    } catch (error) {
        console.log(error)
    }
});

router.use("/:companyID/roles",companyRolesRouter);

router.get("/:companyID", async (req, res, next) => {
    let { company } = req.session;
    return res.json({ company })
});


router.use("/", companyApiProperRouter);


module.exports = router;