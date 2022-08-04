let router = require("express").Router()
let tokenGenerateRouter=require("./generate");
let tokenVerifyRouter=require("./verify");

router.use("/generate",tokenGenerateRouter);
router.use("/verify",tokenVerifyRouter);

module.exports = router;