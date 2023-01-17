const router = require("express").Router();
const {
  checkIfEmployeePropExists,
  getEmployeeByEmployeeID,
  getEmployeesTableInfo,
  getEmployeesFlexibleAccessTableInfo,
  getEmployeesByCompanyID,
} = require("../../../db/employee");
const addEmployeeRouter = require("./addEmployee");
const changePhonepinEmployeeRouter = require("./changePhone");
const employeeIDRouter = require("./[employeeID]");
const loginProductRouter = require("./login");
const {
  getBiodataFunc,
  retrieveAccountInfoBasic,
} = require("../../../db/account");
const { getCompanyByID } = require("../../../db/company");

router.get("/flexible_access_info", async (req, res, next) => {
  try {
    let filters = { ...req.session.filters, ...req.query };
    console.log(filters);
    let getEmployeesFlexibleAccessTableInfoRes =
      await getEmployeesFlexibleAccessTableInfo({ filters });
    res.json(getEmployeesFlexibleAccessTableInfoRes);
  } catch (error) {
    console.log(error);
    res.json({ err: error });
  }
});

router.get("/employees_table_info", async (req, res, next) => {
  try {
    let query = req.query;
    let filters = { ...req.session.queried?.filters, ...query };
    console.log(filters);
    let getEmployeesInfoTableRes = await getEmployeesTableInfo({ filters });
    console.log(getEmployeesInfoTableRes);
    res.json(getEmployeesInfoTableRes);
  } catch (error) {
    res.json({ err: error });
  }
});

router.get("/count", async (req, res, next) => {
  try {
    let { employees } = req.session.queried;
    return res.json({ employeeCount: employees.length });
  } catch (error) {
    console.log(error);
  }
});

router.get("/list", async (req, res, next) => {
  try {
    let { employees } = req.session.queried;
    return res.json({ employees });
  } catch (error) {
    console.log(error);
  }
});

router.get("/info", async (req, res, next) => {
  try {
    let { employees } = req.session.queried;
    let employeesInfo = [];
    for (const employee of employees) {
      let { account } = await retrieveAccountInfoBasic({
        identifier: employee.accountID,
      });
      if (!account) {
        continue;
      }
      let { accountID, email } = account;
      let { user } = await getBiodataFunc({ accountID, email });
      if (!user) {
        continue;
      }
      let employeeInfo = { ...employee, ...account, ...user };
      employeesInfo.push(employeeInfo);
    }
    return res.json({ employeesInfo });
  } catch (error) {
    console.log(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    let { employees } = req.session.queried;
    return res.json({ employees });
  } catch (error) {
    console.log(error);
  }
});

router.use(
  "/add",
  addEmployeeRouter
);

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
