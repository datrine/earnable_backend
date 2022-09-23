const router = require("express").Router()
const { mongoClient, ObjectID } = require("../../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies");
const {  companyRoleActionValidateMW, addToRole } = require("../../../../utils/mymiddleware/roleMW");

router.put("/", companyRoleActionValidateMW,addToRole, async (req, res, next) => {
    console
});

module.exports = router;