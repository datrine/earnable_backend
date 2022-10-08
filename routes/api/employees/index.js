const router = require("express").Router();
const {
  checkIfEmployeePropExists,
  getEmployeeByEmployeeID,
  getEmployeesTableInfo,
} = require("../../../db/employee");
const addEmployeeRouter = require("./addEmployee");
const changePhonepinEmployeeRouter = require("./changePhone");
const employeeIDRouter = require("./[employeeID]");
const loginProductRouter = require("./login");


router.get("/employees_table_info",async (req, res, next) => {
  try {
    let query=req.query;
   let filters= {...req.session.queried?.filters,...query};
   console.log(filters)
   let getEmployeesInfoTableRes=await getEmployeesTableInfo({filters});
   console.log(getEmployeesInfoTableRes)
   res.json(getEmployeesInfoTableRes)
  } catch (error) {
    res.json({ err: error });
  }
});

router.use("/add", addEmployeeRouter);

router.use("/login", loginProductRouter);

router.use("/change/phone_pin", changePhonepinEmployeeRouter);

router.get("/checkifexists/:prop/:value", async (req, res, next) => {
  let { prop, value } = req.params;
  let { exists } = await checkIfEmployeePropExists({ prop, value });
  console.log({ exists });
  return res.json({ exists });
});

router.use(
  "/:employeeID/",
  async (req, res, next) => {
    try {
      let { employeeID } = req.params;
      req.session.queried = { ...req.session.queried };
      req.session.queried.employeeID = employeeID;
      let getEmployeeByEmployeeIDRes = await getEmployeeByEmployeeID({
        employeeID,
      });
      if (getEmployeeByEmployeeIDRes.err) {
        return res.json(getEmployeeByEmployeeIDRes);
      }
      req.session.queried.employee = getEmployeeByEmployeeIDRes.employee;
      
      next();
    } catch (error) {
      res.json({ err: error });
    }
  },
  employeeIDRouter
);

module.exports = router;
