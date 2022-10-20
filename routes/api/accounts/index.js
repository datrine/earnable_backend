const router = require("express").Router();
const subscriptionsRouter = require("./subscriptions");
const accountIDRouter = require("./[accountID]");
const actionsRouter = require("./actions");
const activityRouter = require("./activity");
const loginRouter = require("./login");
const verSessIDsRouter= require("./verSessIDs");

const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");
const { accountLogOut, checkIfAccountPropExists } = require("../../../db/account");
const { getEmployeeByAccountID } = require("../../../db/employee");

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
    req.session.queried={...req.session.queried}
    req.session.paramAccountID = req.params.accountID
    req.session.queried.paramAccountID = req.params.accountID
    console.log(req.session.paramAccountID)
    next()
}, accountIDRouter);

router.use("/logout", getAuthAccount, async (req, res, next) => {
    try {
        let { sessID } = req.session.self
        let resLogOut = await accountLogOut({ sessID });
        console.log(resLogOut)
        res.json(resLogOut)
    } catch (error) {

    }
});

module.exports = router;