const router = require("express").Router();
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const subscriptionsRouter = require("./subscriptions");
const actionsRouter = require("./actions");
const activityRouter = require("./activity");
const loginRouter = require("./login");
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
router.use("/login", loginRouter,);

//user id, email or username
router.use("/", getAuthAccount,);
router.use("/subscriptions", subscriptionsRouter);

router.get("/:accountID/employee_details", async (req, res, next) => {
    try {
        let { accountID } = req.params
        let employeeRes = await getEmployeeByAccountID({ accountID });
        return res.json({ ...employeeRes })
    } catch (error) {

    }
});

router.get("/:accountID/bank_details", async (req, res, next) => {
    try {
        let { accountID } = req.params
        let bankDetailsRes = await getBankDetailsByAccountID({ accountID });
        return res.json({ ...bankDetailsRes })
    } catch (error) {

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