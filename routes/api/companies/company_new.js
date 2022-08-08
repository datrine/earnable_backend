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
        let rolesRes = await createRoles({ roles, companyID: companyRes.companyID, creatorMeta: { accountID: account.accountID } })
        if (rolesRes.err) {
            return res.json(rolesRes.err)
        }
        console.log("ppppppppppppppp")
        let resourceRes = await createResource({
            accountID: account.accountID,
            resource_type: "company"
            , resourceDocID: companyRes.companyID
        });
        if (resourceRes.err) {
            return res.json(rolesRes.err)
        }
        console.log({
            companyID: companyRes.companyID,
            rolesID: rolesRes.rolesID,
            resourceID: resourceRes.resourceID
        });
        res.status(201);
        return res.json({
            companyID: companyRes.companyID,
            rolesID: rolesRes.rolesID,
            resourceID: resourceRes.resourceID
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