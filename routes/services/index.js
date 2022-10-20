const emailRouter = require("./email");
const tokenRouter = require("./token");
const router = require("express").Router();
router.use("/", async(req,res,next)=>{
    req.session.queried={};
    next()
});

router.use("/email", emailRouter);
router.use("/token", tokenRouter);
module.exports = router