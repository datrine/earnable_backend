const router = require("express").Router();
const { nanoid } = require("nanoid");
const {
  createDepartment,
  getDepartmentsByCompanyID,
  getDepartmentByDepartmentID,
  editDepartment,
} = require("../../../../db/department");
const { getEmployeesByCompanyID } = require("../../../../db/employee");
const departmentEmployeesRouter = require("./employees");
const departmentPoliciesRouter = require("./policies");

router.post("/", async (req, res, next) => {
  try {
    let { companyID } = req.session;
    let deptCreationObj = req.body;
    let rolesRes = await createDepartment({ companyID, ...deptCreationObj });
    if (rolesRes.err) {
      return res.json(rolesRes);
    }
    res.json(rolesRes);
  } catch (error) {
    console.log(error);
  }
});

router.put("/:departmentID", async (req, res, next) => {
  try {
    let { accountID } = req.session.account;
    let { departmentID, companyID } = req.params;
    let { _id, ...editedDeptObj } = req.body;
    if (editedDeptObj.dept_policies && editedDeptObj.dept_policies.length > 0) {
      editedDeptObj.dept_policies = editedDeptObj.dept_policies.map((obj) => ({
        id: nanoid(),
        ...obj,
        editor: accountID,
        createdOn: new Date(),
      }));
    }
    let rolesRes = await editDepartment({
      departmentID,
      companyID,
      ...editedDeptObj,
    });
    return res.json(rolesRes);
  } catch (error) {
    console.log(error);
  }
});

router.use("/:departmentID", async (req, res, next) => {
  try {
    let { departmentID } = req.params;
    req.session.departmentID=departmentID;
    let rolesRes = await getDepartmentByDepartmentID({ departmentID });
    if (rolesRes.err) {
      return res.json(rolesRes);
    }
    req.session.department = rolesRes.department;
    next();
  } catch (error) {
    console.log(error);
  }
});

router.use( "/:departmentID/policies",
  async (req, res, next) => {
    req.session.departmentID = req.params.departmentID;
    next();
  },
  departmentPoliciesRouter
);

router.use("/:departmentID/employees", departmentEmployeesRouter);

router.get("/:departmentID", async (req, res, next) => {
  try {
    let { department } = req.session;
    return res.json({ department });
  } catch (error) {
    console.log(error);
  }
});

router.use("/", async (req, res, next) => {
  try {
    let { companyID } = req.session;
    let filters = req.query;
    let departmentsRes = await getDepartmentsByCompanyID({
      companyID,
      filters,
    });
    if (departmentsRes.err) {
      return res.json(departmentsRes);
    }
    req.session.departments = departmentsRes.departments;
    next();
  } catch (error) {
    console.log(error);
    return res.json(error);
  }
});

router.get("/count", async (req, res, next) => {
  try {
    let { employees } = req.session;
    return res.json({ employeeCount: employees.length });
  } catch (error) {
    console.log(error);
  }
});

router.get("/list", async (req, res, next) => {
  try {
    let { employees } = req.session;
    return res.json({ employees });
  } catch (error) {
    console.log(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    let { departments } = req.session;
    return res.json({ departments });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
