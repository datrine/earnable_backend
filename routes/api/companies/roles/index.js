const router = require("express").Router()
const { mongoClient, ObjectID } = require("../../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies")
const { cleanAndValidateNewCompany } = require("../../../../utils/validators/companies");//utils/validators/companies
const { setDefaultRoles, defaultCompanyAdminRoles } = require("../../../../utils/misc/company_roles");
const { companyRoleActionValidateMW, hasAdminScopeMW, } = require("../../../../utils/mymiddleware/roleMW");
const addUserToRoleRouter = require("./addUsersToRoles");
const removeUserFromRoleRouter = require("./removeUserFromRole");
const sessIDVerifyMW = require("../../../../utils/mymiddleware/sessIDVerifyMW");
const { getCompanyRoles, createNewRole, hasRole, hasScope, getScopeByAccID } = require("../../../../db/role");

router.get("/", async (req, res, next) => {
    try {
        let rolesRes = await getCompanyRoles({ companyID });
        if (rolesRes.err) {
            return res.json(rolesRes)
        }
    } catch (error) {
        console.log(error)
    }
});

router.get("/my_scope", async (req, res, next) => {
    try {
        let {companyID}=req.session.company
        let {accountID}=req.session.account
        console.log(companyID)
        let scopeRes = await getScopeByAccID({ companyID,accountID });
        return res.json(scopeRes)
    } catch (error) {
        console.log(error)
    }
});

router.post("/role", async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account;
        let preShopData = req.body;
        preShopData.creatorMeta = { _id: account._id, email: account.email }
        let shopData = cleanAndValidateNewCompany(preShopData);
        let roles = setDefaultRoles({ account })
        let result = await companiesCol.insertOne({
            ...shopData,
            roles,
            lastModified: new Date(),
            createdOn: new Date(),
        });
        if (!result.insertedId) {

        }
        res.status(201)
        return res.json({ _id: result.insertedId })
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
});


router.post("/createRole", hasAdminScopeMW, async (req, res, next) => {
    try {
        let roleObj = req.body;
        let addRoleRes = await createNewRole({ roleObj });
        res.status(201)
        console.log(addRoleRes);
        return res.json(addRoleRes)
    } catch (error) {
        console.log(error)
    }
});

router.use("/addToRole", hasAdminScopeMW, addUserToRoleRouter,);

router.use("/removeUserFromRole", hasAdminScopeMW, removeUserFromRoleRouter,);

module.exports = router;