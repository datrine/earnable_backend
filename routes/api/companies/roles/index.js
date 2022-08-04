const router = require("express").Router()
const { mongoClient, ObjectID } = require("../../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies")
const { cleanAndValidateNewCompany } = require("../../../../utils/validators/companies");//utils/validators/companies
const { setDefaultRoles } = require("../../../../utils/misc/shop_roles");
const { companyRoleActionValidateMW, } = require("../../../../utils/mymiddleware/roleMW");
const addUserToRoleRouter = require("./addUsersToRoles");
const removeUserFromRoleRouter = require("./removeUserFromRole");
const sessIDVerifyMW = require("../../../../utils/mymiddleware/sessIDVerifyMW");

router.use("/", sessIDVerifyMW);

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

router.use("/addToRole", companyRoleActionValidateMW, addUserToRoleRouter,);

router.use("/removeUserFromRole", companyRoleActionValidateMW, removeUserFromRoleRouter,);

module.exports = router;