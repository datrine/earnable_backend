const { accountAccIDResetSet, getBiodataFunc } = require("../../../db/account");
const { getMyResources, getResourcesByID } = require("../../../db/resource");
const { getCompanyRoles } = require("../../../db/role");
const { accTemplate } = require("../../../db/templates");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");
let resourcesRouter=require("./resources")

const router = require("express").Router();


router.get("/user", async (req, res, next) => {
    try {
        let account = req.session.account
        let { err, user } = await getBiodataFunc({ email: account.email, accountID: account.accountID })
        if (err) {
            return res.json({ err })
        }
        return res.json({ user, })
    } catch (error) {
        console.log(error);
    }
});

router.use("/resources",resourcesRouter);

router.get("/", async (req, res, next) => {
    try {
        let account = req.session.account
        return res.json({ account, })
    } catch (error) {
        console.log(error);
    }
});

router.get("/company_roles", async(req,res,next)=>{
    try {
     let rolesRes=  await getCompanyRoles({companyID});
     if (rolesRes.err) {
        return res.json(rolesRes)
     }
    } catch (error) {
        console.log(error)
    }
});
module.exports = router