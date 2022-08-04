const router = require("express").Router()
const companiesRouter = require("./companies");
const usersRouter = require("./users");
const sessionRouter = require("./session");
const selfRouter = require("./me");
const paymentRouter = require("./payments");
const verStatusRouter = require("./acc_ver");
const registerRouter = require("./users/register");
//const loginRouter = require("./users/login");
const loginRouter = require("./users/login");
//const selfRouter = require("./users/me");
const emailRouter = require("./email");
const accountRouter = require("./accounts");
const employeesRouter = require("./employees");
const employersRouter = require("./employers");
const ordersRouter = require("./orders");
const webhooksRouter = require("./webhooks");
const tokenVerifyMW = require("../../utils/mymiddleware/tokenVerifyMW");
const { getAuthAccount } = require("../../from/utils/middlewares/getAuthAccount");
const { getAccount } = require("../../from/utils/middlewares/getAccount");

router.use((req, res, next) => {
    console.log("apis")
    next();
});

router.use("/email", emailRouter);

router.use("/users", usersRouter);

router.use("/register", registerRouter);

router.use("/login", loginRouter);

router.use("/accounts", accountRouter);

router.use("/session", sessionRouter);

router.use("/payments", paymentRouter);

router.use("/ver_status", verStatusRouter);

router.use("/companies", companiesRouter);

router.use("/webhooks", webhooksRouter);

router.use("/employees", employeesRouter);

router.use("/employers", employersRouter);

router.use("/my_orders",tokenVerifyMW, ordersRouter);

router.use("/orders", ordersRouter);

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
        req.session.sessID = sessID
        next()
    } catch (error) {
        console.log(error);
        next(error)
    }
}, getAuthAccount);

router.use("/me", selfRouter);

module.exports = router;