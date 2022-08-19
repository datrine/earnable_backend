const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies");
const { cleanAndValidateNewCompany } = require("../../../utils/validators/companies");
const { setDefaultRoles } = require("../../../utils/misc/company_roles");
const { canCreateCompanyMW } = require("../../../utils/mymiddleware/accounts/canCreateShopMW");
const { ObjectId } = require("bson");
const sessIDVerifyMW = require("../../../utils/mymiddleware/sessIDVerifyMW");
const { getBiodataFunc } = require("../../../db/account");
const { createCompany } = require("../../../db/company");
const { createRoles } = require("../../../db/role");
const { createResource } = require("../../../db/resource");
const { getOrCreateCompanyWallet } = require("../../../db/wallet");

router.post("/create", sessIDVerifyMW, canCreateCompanyMW, async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account
        let preCompanyData = req.body;

        preCompanyData.creatorMeta = { _id: ObjectId(account._id), accountID: account.accountID, };
        let roles = setDefaultRoles({ account });

        let companyRes = await createCompany({ ...preCompanyData })
        if (companyRes.err) {
            return res.json(companyRes)
        }
        let { companyID } = companyRes
        let rolesRes = await createRoles({ roles, companyID, creatorMeta: { accountID: account.accountID } })
        if (rolesRes.err) {
            return res.json(rolesRes.err)
        }
        let resourceRes = await createResource({
            accountID: account.accountID,
            resource_type: "company",
            resourceDocID: companyID
        });
        if (resourceRes.err) {
            return res.json(rolesRes.err)
        }
        let walletRes = await getOrCreateCompanyWallet({ companyID });
        if (walletRes.err) {
            return res.json(walletRes.err)
        }
        console.log({
            companyID: companyID,
            rolesID: rolesRes.rolesID,
            resourceID: resourceRes.resourceID,
            walletID: walletRes.walletID
        });
        res.status(201);
        return res.json({
            companyID: companyRes.companyID,
            rolesID: rolesRes.rolesID,
            resourceID: resourceRes.resourceID,
            walletID: walletRes.walletID
        })
    } catch (error) {
        console.log(error)
        res.status(500)
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