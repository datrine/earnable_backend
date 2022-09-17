const router = require("express").Router();
const subscriptionsRouter = require("../subscriptions");
const withdrawalHistoryRouter = require("./withdrawal_history");
const { getAuthAccount } = require("../../../../from/utils/middlewares/getAuthAccount");
const { accountLogOut, getUserInfo, } = require("../../../../db/account");
const { getEmployeeByAccountID } = require("../../../../db/employee");
const { getBankDetailsByAccountID } = require("../../../../db/bank_detail");

//user id, email or username
router.use("/", getAuthAccount, async (req, res, next) => {
    next()
});

router.use("/withdrawal_history", withdrawalHistoryRouter);

router.use("/subscriptions", subscriptionsRouter);

router.get("/employee_details", async (req, res, next) => {
    try {
        let { accountID } = req.session
        let employeeRes = await getEmployeeByAccountID({ accountID });
        return res.json({ ...employeeRes })
    } catch (error) {

    }
});


router.get("/userinfo", async (req, res, next) => {
    try {
        let { accountID } = req.session
        let employeeRes = await getUserInfo({ accountID });
        return res.json({ ...employeeRes })
    } catch (error) {

    }
});

router.get("/bank_details", async (req, res, next) => {
    try {
        let { accountID } = req.session

        let bankDetailsRes = await getBankDetailsByAccountID({ accountID });
        return res.json({ ...bankDetailsRes })
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