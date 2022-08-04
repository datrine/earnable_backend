const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const companyRolesRouter = require("./roles");
const companyApiProperRouter = require("./company_new");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");
const companiesCol = waleprjDB.collection("companies")

router.use("/", getAuthAccount);
router.use("/roles", companyRolesRouter);


router.get("/:accountID/list", async (req, res, next) => {
    let { accountID } = req.params;
    console.log("ooooooooooooooooo")
    let filter = req.query;
    let { skip = 0, limit = 5, ...rest } = filter
    let cursor = await companiesCol.find({
      "creatorMeta.accountID":  accountID
    }, { projection: { roles: 0 }, skip, limit });
    let companies = await cursor.toArray() || [];
    companies=companies.map(obj=>({...obj,companyID:obj._id}))
    res.json({ companies })
});

router.get("/list", async (req, res, next) => {
    let filter = req.query;
    let { skip = 0, limit = 5, ...rest } = filter
    let cursor = await companiesCol.find({
        ...filter
    }, { projection: { roles: 0 }, skip, limit });
    let shops = await cursor.toArray() || [];
    res.json({ shops })
});

router.use("/", companyApiProperRouter);


module.exports = router;