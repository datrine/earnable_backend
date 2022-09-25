const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const { ObjectId, UUID } = require("bson");

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

let updateEmployeeInfo = async ({
  employeeID,
  companyIssuedEmployeeID,
  ...employeeUpdateData
}) => {
  try {
    let result1 = await employeesCol.findOneAndUpdate(
      {
        $or: [{ _id: ObjectId.isValid(employeeID)?ObjectId(employeeID):employeeID }, { companyIssuedEmployeeID }],
      },
      { $set: { ...employeeUpdateData, lastModified: new Date() } }
    );
    if (!result1.ok) {
      return { err: { msg: "Unable to update employee..." } };
    }
    return {info:"Employee details updated..." };
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
    let employeeDoc = await employeesCol.find({ _id: ObjectId(employeeID) });
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
  getEmployeeByAccountID,updateEmployeeInfo,checkIfEmployeePropExists
};
