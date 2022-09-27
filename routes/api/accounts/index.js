const router = require("express").Router();
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const subscriptionsRouter = require("./subscriptions");
const accountIDRouter = require("./[accountID]");
const actionsRouter = require("./actions");
const activityRouter = require("./activity");
const loginRouter = require("./login");
const verSessIDsRouter= require("./verSessIDs");

const { getAccountMW } = require("../../../utils/mymiddleware/accounts");
const { createAccount } = require("../../../utils/dbmethods/account_methods");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");
const { accountLogOut, checkIfAccountPropExists } = require("../../../db/account");
const { getEmployeeByAccountID } = require("../../../db/employee");
const { getBankDetailsByAccountID } = require("../../../db/bank_detail");

//user id, email or username
router.get("/checkifexists/:prop/:value", async (req, res, next) => {
    let { prop, value } = req.params;
    let { exists } = await checkIfAccountPropExists({ prop, value });
    console.log({ exists })
    return res.json({ exists })
});
router.use("/actions", actionsRouter,);
router.use("/activity", activityRouter,);
router.use("/verSessIDs", verSessIDsRouter);
router.use("/login", loginRouter,);

//user id, email or username
router.use("/", getAuthAccount,);
router.use("/subscriptions", subscriptionsRouter);

router.use("/:accountID", async (req, res, next) => {
    req.session.paramAccountID = req.params.accountID
    next()
}, accountIDRouter);

router.get("/", async (req, res, next) => {
    try {
        let { companyID, account } = req.session;
        let { accountID } = account
        getEmployeeByAccountID({ accountID })
        let filters = req.query;
        let withdrawalHistoryRes = await getEmployeeWithdrawalHistory({ employeeID, filters });
        res.json(withdrawalHistoryRes);
    } catch (error) {
        console.log(error)
    }
});

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