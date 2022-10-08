const router = require("express").Router();
const { getEmployeeFlexibleAccess, getEmployeesTableInfo } = require("../../../db/employee");
const changePhonepinEmployeeRouter = require("./changePhone");
const editEmployeeRouter = require("./editEmployee");
const calculationsRouter = require("../calculations");

router.get("/flexible_access", async (req, res, next) => {
  try {
    let { employeeID } = req.session.queried;
    let getEmployeeFlexibleAccessRes = await getEmployeeFlexibleAccess({
      filters: { employeeID },
    });
    res.json(getEmployeeFlexibleAccessRes);
  } catch (error) {
    res.json({ err: error });
  }
});

router.use("/calculations",async (req, res, next) => {
  try {
    let { employeeID } = req.session.queried;
   let filters= req.session.queried?.filters||{};
   filters.employeeID=employeeID;
    req.session.queried.employeeID=employeeID;
    req.session.queried.filters=filters;
    next()
  } catch (error) {
    res.json({ err: error });
  }
}, calculationsRouter);

router.use("/edit", editEmployeeRouter);

router.use("/change/phone_pin", changePhonepinEmployeeRouter);

module.exports = router;
