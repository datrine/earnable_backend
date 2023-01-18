const router = require("express").Router()
const employeeViewRouter = require("./employee");

router.use("/", async (req, res, next) => {
    next()
});

router.use("/employee", employeeViewRouter);
module.exports = router;