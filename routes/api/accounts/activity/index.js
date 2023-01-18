const router = require("express").Router();
const subscriptionsRouter = require("../subscriptions");
const { getAuthAccount } = require("../../../../from/utils/middlewares/getAuthAccount");
const { accountLogOut,  getCurrentAccountActivity } = require("../../../../db/account");

//user id, email or username
router.get("/current", async (req, res, next) => {
    try {
    let {identifier}= req.query;
    console.log(identifier)
    let { err,activity,...rest } = await getCurrentAccountActivity({identifier });
    if (err) {
        return res.json({ err })
    }
    return res.json({activity})
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