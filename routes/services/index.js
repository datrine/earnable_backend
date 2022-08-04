const emailRouter = require("./email");
const tokenRouter = require("./token");
const router = require("express").Router();

router.use("/email", emailRouter);
router.use("/token", tokenRouter);
module.exports = router