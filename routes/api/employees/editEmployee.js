const router = require("express").Router();
const { mongoClient, ObjectID } = require("../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const { ObjectId } = require("bson");
const { hasRole } = require("../../../db/role");
const {
  getAuthAccount,
} = require("../../../from/utils/middlewares/getAuthAccount");
const {
  updateEmployeeInfo,
  getEmployeeByEmployeeID,
} = require("../../../db/employee");

const { getBankDetailsByAccountID } = require("../../../db/bank_detail");
const { attemptChangeEnrollmentStatus } = require("../../../db");

let changedData = {
  /**
   * @type {number}
   */
  monthly_salary: undefined,
  /**
   * @type {string}
   */
  job_title: undefined,
  /**
   * @type {string}
   */
  deptID: undefined,
  /**
   * @type { "pending" | "enrolled" | "unenrolled"}
   */
  enrollment_status: undefined,
  /**
   * @type { "active" | "inactive"}
   */
  status: undefined,
};

router.put("/", getAuthAccount, async (req, res, next) => {
  try {
    let { account } = req.session;
    let hasRoleRes = await hasRole({
      accountID: account.accountID,
      rolename: "editEmployee",
    });
    if (!hasRoleRes) {
      return res.json({ err: { msg: "You do not have authorization." } });
    }
    let {
      employeeID,
      companyIssuedEmployeeID,
      enrollment_status,
      ...restOfUpdates
    } = req.body;
    if (!employeeID) {
      return res.json({ err: { msg: "No employee ID supplied." } });
    }
    let updateRes = await updateEmployeeInfo({
      employeeID,
      companyIssuedEmployeeID,
      ...restOfUpdates,
    });
    res.json(updateRes);
  } catch (error) {
    console.log(error);
    res.json({ err: error });
  }
});

router.put("/enrollment_status", getAuthAccount, async (req, res, next) => {
  try {
    let { account } = req.session;
    let hasRoleRes = await hasRole({
      accountID: account.accountID,
      rolename: "editEmployee",
    });
    if (!hasRoleRes) {
      return res.json({ err: { msg: "You do not have authorization." } });
    }
    let { employeeID, enrollment_status } = req.body;
    if (!employeeID) {
      return res.json({ err: { msg: "No employee ID supplied." } });
    }
    let getEmployeeRes = await getEmployeeByEmployeeID({ employeeID });
    if (getEmployeeRes.err) {
      if (canSendReply) {
        res.json(getEmployeeRes);
        return;
      }
    }
    let employeeAccountID = getEmployeeRes.employee.accountID;

    let responseOfAttempt = await attemptChangeEnrollmentStatus({
      accountID: employeeAccountID,
      employeeID,
      enrollment_status,
    });
    res.json(responseOfAttempt);
  } catch (error) {
    console.log(error);
    res.json({ err: error });
  }
});

module.exports = router;
