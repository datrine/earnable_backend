const router = require("express").Router();
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const subscriptionsRouter = require("./subscriptions");
const { getAccountMW } = require("../../../utils/mymiddleware/accounts");
const { createAccount } = require("../../../utils/dbmethods/account_methods");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");

//user id, email or username
router.use("/", getAuthAccount,);
router.use("/subscriptions", subscriptionsRouter);

router.get("/", (req, res, next) => {
    return res.json([])
});

module.exports = router;