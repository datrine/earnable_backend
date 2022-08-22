const router = require("express").Router();
const tokenVerifyMW = require("../../../../utils/mymiddleware/tokenVerifyMW");
const subscriptionsRouter = require("../subscriptions");
const { getAccountMW } = require("../../../../utils/mymiddleware/accounts");
const { createAccount } = require("../../../../utils/dbmethods/account_methods");
const { getAuthAccount } = require("../../../../from/utils/middlewares/getAuthAccount");
const { accountLogOut, checkIfAccountPropExists, activateEmployeeAccount } = require("../../../../db/account");

//user id, email or username
router.put("/activate_new", async (req, res, next) => {
    try {
        
    let reqBody= req.body;
    console.log(reqBody)
    let { err,...rest } = await activateEmployeeAccount({ ...reqBody });
    if (err) {
        return res.json({ err })
    }
    return res.json({...rest})
    } catch (error) {
        console.log(error)
        res.json({err:error})
    }
});

//user id, email or username
router.use("/", getAuthAccount,);
router.use("/subscriptions", subscriptionsRouter);

router.get("/", (req, res, next) => {
    return res.json([])
});



router.use("/logout", getAuthAccount, async (req, res, next) => {
    try {
        let { sessID } = req.session
        let resLogOut = await accountLogOut({ sessID });
        console.log(resLogOut)
        res.json(resLogOut)
    } catch (error) {

    }
});

module.exports = router;