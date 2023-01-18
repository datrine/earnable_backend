const router = require("express").Router()
const {  companyRoleActionValidateMW, addToRole } = require("../../../../utils/mymiddleware/roleMW");

router.put("/", companyRoleActionValidateMW,addToRole, async (req, res, next) => {
    console
});

module.exports = router;