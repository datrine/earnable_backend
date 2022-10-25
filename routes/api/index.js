const router = require("express").Router()
const companiesRouter = require("./companies");
const usersRouter = require("./users");
const sessionRouter = require("./session");
const selfRouter = require("./me");
const verStatusRouter = require("./acc_ver");
const registerRouter = require("./users/register");
const pageViewsRouter = require("./page_views");
const loginRouter = require("./users/login");
//const selfRouter = require("./users/me");
const transactionsRouter=require("./transactions")
const withdrawalsRouter=require("./withdrawals")
const accountRouter = require("./accounts");
const employeesRouter = require("./employees");
const employersRouter = require("./employers");
const webhooksRouter = require("./webhooks");
const tokenVerifyMW = require("../../utils/mymiddleware/tokenVerifyMW");
const { getAuthAccount } = require("../../from/utils/middlewares/getAuthAccount");
const { getAccount } = require("../../from/utils/middlewares/getAccount");

router.use("/users", usersRouter);

router.use("/register", registerRouter);

router.use("/login", loginRouter);

router.use("/accounts", accountRouter);

router.use("/session", sessionRouter);

router.use("/ver_status", verStatusRouter);

router.use("/transactions", transactionsRouter);

router.use("/withdrawals", withdrawalsRouter);

router.use("/companies", companiesRouter);

router.use("/webhooks", webhooksRouter);

router.use("/employees", employeesRouter);

router.use("/page_views", pageViewsRouter);

router.use("/employers", employersRouter);

router.use("/", async (req, res, next) => {
    try {
        let sessID = req.headers.authorization?.split(" ")[1];
        if (!sessID) {
            return res.json({
                err: {
                    msg: "No bearer token added",
                    type: "no_auth_token"
                }
            })
        }
        req.session.self={}
        req.session.sessID = sessID
        req.session.self.sessID = sessID
        next()
    } catch (error) {
        console.log(error);
        next(error)
    }
}, getAuthAccount);

router.use("/me", selfRouter);

module.exports = router;