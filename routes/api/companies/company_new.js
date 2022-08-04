const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies");
const companyRolesCol = waleprjDB.collection("companyRoles");
const { cleanAndValidateNewCompany } = require("../../../utils/validators/companies");
const { setDefaultRoles } = require("../../../utils/misc/shop_roles");
const { getAccountMW } = require("../../../utils/mymiddleware/accounts");
const { canCreateCompanyMW } = require("../../../utils/mymiddleware/accounts/canCreateShopMW");
const { ObjectId } = require("bson");
const sessIDVerifyMW = require("../../../utils/mymiddleware/sessIDVerifyMW");
const { getBiodataFunc } = require("../../../db/account");

router.post("/create", sessIDVerifyMW, canCreateCompanyMW, async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account
        let preCompanyData = req.body;
        let companyRoles = preCompanyData.companyRoles || [];

        preCompanyData.creatorMeta = { _id: ObjectId(account._id), accountID: account.accountID, email: account.email };
        let companyData = cleanAndValidateNewCompany(preCompanyData);
        let roles = setDefaultRoles({ account });
        let metaInfo = await getBiodataFunc({ accountID: account.accountID });
        let result1 = await companiesCol.insertOne({
            ...companyData,
            roles,
            lastModified: new Date(),
            createdOn: new Date(),
        });
        if (!result1.insertedId) {
            return res.json({ err: { msg: "Unable to create" } })
        }
        let creatorRoles = []
        if (metaInfo?.user) {
            creatorRoles = metaInfo.user.meta.companyRoles||[]
            companyRoles.push(...creatorRoles);
        }
        let result2 = await companyRolesCol.insertOne({
            companyID: ObjectId(result1.insertedId),
            userAccID: account.accountID,
            roles: [...companyRoles],
            lastModified: new Date(),
            createdOn: new Date(),
        });

        res.status(201);

        if (!result2.insertedId) {
            return res.json({ err: { msg: "Unable to create" } })
        }
        return res.json({ companyID: result1.insertedId, rolesID: result2.insertedId })
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
});

router.get("/my_list", sessIDVerifyMW, async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account
        let filter = req.query;
        let { skip = 0, limit = 5, ...rest } = filter
        let cursor = await companiesCol.find({
            "creatorMeta.accountID": account.accountID,
            ...filter
        }, { skip, limit });
        let shops = await cursor.toArray() || [];
        res.status(200)
        return res.json({ shops })
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
});

module.exports = router;