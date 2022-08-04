const emailRouter = require("./email");
const tokenRouter = require("./token");
const accVerRouter = require("./acc_ver");
const router = require("express").Router();

router.use("/email", emailRouter);
router.use("/token", tokenRouter);
router.use("/acc_ver", accVerRouter);
module.exports = router