const router = require("express").Router();
const addEmployeeRouter = require("./addEmployee");
const changePhonepinEmployeeRouter = require("./changePhone");
const editProductRouter = require("./editEmployee");
const loginProductRouter = require("./login");

router.use("/add", addEmployeeRouter);

router.use("/edit", editProductRouter);

router.use("/login", loginProductRouter);

router.use("/change/phone_pin", changePhonepinEmployeeRouter);

module.exports = router;