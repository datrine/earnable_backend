const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const { ObjectId, UUID } = require("bson");
const { employeeTemplate } = require("./templates");

let addEmployee = async ({ ...employeeToData }) => {
  try {
    let result1 = await employeesCol.insertOne({
      companyIssuedEmployeeID:
        employeeToData.employeeID || employeeToData.companyIssuedEmployeeID,
      ...employeeToData,
      lastModified: new Date(),
      createdOn: new Date(),
    });
    if (!result1.insertedId) {
      return { err: { msg: "Unable to Add employee..." } };
    }
    return { employeeID: result1.insertedId.toString() };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let updateEmployeeInfo = async ({ employeeID, ...employeeUpdateData }) => {
  try {
    let obj = {};
    if (employeeUpdateData.enrollment_status) {
      let { enrollment_status, ...rest } = employeeUpdateData;
      obj.enrollment_state = {
        state: enrollment_status,
        createdOn: new Date(),
      };
      employeeUpdateData = rest;
    }
    if (employeeUpdateData.lastModified) {
      //destructure away lastModified
      let { lastModified, ...rest } = employeeUpdateData;
      employeeUpdateData = rest;
    }
    if (employeeUpdateData.accountID) {
      //destructure away lastModified
      let { accountID, ...rest } = employeeUpdateData;
      employeeUpdateData = rest;
    }
    if (employeeUpdateData.deptID) {
      //destructure away deptID
      let { deptID, department, ...rest } = employeeUpdateData;
      obj.deptID = deptID;
      obj.department = department;
      employeeUpdateData = rest;
    }

    if (employeeUpdateData.companyIssuedEmployeeID) {
      //destructure away lastModified
      let { companyIssuedEmployeeID, ...rest } = employeeUpdateData;
      obj.companyIssuedEmployeeID = companyIssuedEmployeeID;
      employeeUpdateData = rest;
    }

    if (employeeUpdateData.job_title) {
      //destructure away lastModified
      let { job_title, ...rest } = employeeUpdateData;
      obj.job_title = job_title;
      employeeUpdateData = rest;
    }

    if (employeeUpdateData.monthly_salary) {
      //destructure away lastModified
      let { monthly_salary, ...rest } = employeeUpdateData;
      monthly_salary = Number(monthly_salary);
      if (!Number.isNaN(monthly_salary)) {
        obj.monthly_salary = Number(monthly_salary);
      }
      employeeUpdateData = rest;
    }

    let result1 = await employeesCol.findOneAndUpdate(
      {
        _id: ObjectId.isValid(employeeID)
          ? ObjectId(employeeID)
          : employeeID.toString(),
      },
      { $set: { ...obj, lastModified: new Date() } },
      { upsert: true, returnDocument: "after" }
    );
    if (!result1.ok) {
      return { err: { msg: "Unable to update employee..." } };
    }
    return { info: "Employee details updated..." };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getEmployeesByCompanyID = async ({ companyID, filters }) => {
  try {
    let employeesCursor;
    let filterBuilder = {};
    //console.log(filterBuilder)
    if (filters.enrollment_state === "enrolled") {
      filterBuilder["enrollment_state.state"] = { $eq: "enrolled" };
    }

    if (filters.enrollment_state && filters.enrollment_state !== "enrolled") {
      filterBuilder["enrollment_state.state"] = { $ne: "enrolled" };
    }
    employeesCursor = await employeesCol.find({ companyID, ...filterBuilder });
    let employees = await employeesCursor.toArray();
    employees = employees.map((employee) => ({
      ...employee,
      employeeID: employee._id,
    }));
    return { employees };
  } catch (error) {
    console.log({ err: error });
    return { err: error };
  }
};

let getTotalSalaries = async ({ companyID }) => {
  try {
    let cursor = employeesCol.aggregate([
      {
        $match: {
          companyID: companyID,
        },
      },
      {
        $group: {
          _id: "$companyID",
          total_monthly_salaries: {
            $sum: {
              $toInt: "$monthly_salary",
            },
          },
        },
      },
    ]);
    let results = await cursor.toArray();
    console.log(cursor.loadBalanced);
    let total_monthly_salaries = results[0]?.total_monthly_salaries || 0;
    return { total_monthly_salaries };
  } catch (error) {
    console.log(error);
  }
};

let getEmployeesByDepartmentID = async ({ companyID, deptID, filters }) => {
  try {
    let employeesCursor;
    let filterBuilder = {};

    if (filters.enrolled) {
      filterBuilder.enrolled = true;
    }

    if (filters.unenrolled) {
      filterBuilder.enrolled = { $ne: true };
    }

    employeesCursor = await employeesCol.find({
      $or: [{ companyID }, { companyID: ObjectId(companyID) }],
      deptID,
      ...filterBuilder,
    });
    let employees = await employeesCursor.toArray();
    employees = employees.map((employee) => ({
      ...employee,
      employeeID: employee._id,
    }));
    return { employees };
  } catch (error) {
    console.log({ err: error });
  }
};

let getEmployeeByEmployeeID = async ({ employeeID }) => {
  try {
    /**
     * @type {employeeTemplate}
     */
    let employeeDoc = await employeesCol.findOne({
      _id: ObjectId.isValid(employeeID) ? ObjectId(employeeID) : employeeID,
    });
    if (!employeeDoc) {
      return { err: { msg: "Employee not found" } };
    }

    return { employee: { ...employeeDoc, employeeID } };
  } catch (error) {
    console.log({ err: error });
  }
};

let getEmployeeByAccountID = async ({ accountID }) => {
  try {
    let employeeDoc = await employeesCol.findOne({ accountID });
    if (!employeeDoc) {
      return { err: { msg: "Employee not found" } };
    }

    return { employee: { ...employeeDoc, employeeID: employeeDoc._id } };
  } catch (error) {
    console.log({ err: error });
  }
};

async function checkIfEmployeePropExists({ prop, value }) {
  try {
    /**
     * @type {accTemplate}
     */
    let account = await employeesCol.findOne({
      [prop]: value,
    });
    if (!account) {
      return { exists: false };
    }
    return { exists: true };
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  addEmployee,
  getEmployeesByCompanyID,
  getEmployeeByEmployeeID,
  getEmployeesByDepartmentID,
  getTotalSalaries,
  getEmployeeByAccountID,
  updateEmployeeInfo,
  checkIfEmployeePropExists,
};
