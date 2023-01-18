const router = require("express").Router();
const subscriptionsRouter = require("../subscriptions");
const withdrawalHistoryRouter = require("./withdrawal_history");
const bankDetailsHistoryRouter = require("./bank_details");
const pageViewsRouter = require("../../page_views");
const { getAuthAccount } = require("../../../../from/utils/middlewares/getAuthAccount");
const { getUserInfo } = require("../../../../db/account");
const { getEmployeeByAccountID } = require("../../../../db/employee");
const { getEmployeeEarningsAndWithdrawals } = require("../../../../db/calculations");

//user id, email or username
router.use("/", async (req, res, next) => {
    next()
} ,getAuthAccount,);


router.use("/withdrawal_history", withdrawalHistoryRouter);

router.use("/subscriptions", subscriptionsRouter);

router.use("/bank_details", bankDetailsHistoryRouter);

router.use("/page_views", pageViewsRouter);

router.get("/employee_details", async (req, res, next) => {
    try {
        let { paramAccountID } = req.session.queried
        let employeeRes = await getEmployeeByAccountID({ accountID: paramAccountID });
        return res.json({ ...employeeRes })
    } catch (error) {
        console.log(error);
        res.json({err:error})
    }
});

router.get("/userinfo", async (req, res, next) => {
    try {
        let { paramAccountID } = req.session.queried
        let employeeRes = await getUserInfo({ accountID: paramAccountID });
        return res.json({ ...employeeRes })
    } catch (error) {

    }
});

router.get("/employee_withdrawals_earnings", async (req, res, next) => {
    let {accountID } = req.session.queried;
    let filters=req.query;
    filters.accountID = accountID;
    let getAmountToRefundRes = await getEmployeeEarningsAndWithdrawals({ filters });
    return res.json(getAmountToRefundRes);
  });

module.exports = router;