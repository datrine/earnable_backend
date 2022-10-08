const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const { ObjectId, UUID } = require("bson");
const { employeeTemplate } = require("./templates");
const { composeGetEmployeeInfoTableAgg } = require("./pipelines/employer");

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
    console.log({ filters });
    let filterBuilder = {};
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
    /**
     * @type {employeeTemplate}
     */
    let employeeDoc = await employeesCol.findOne({ accountID });
    if (!employeeDoc) {
      return { err: { msg: "Employee not found" } };
    }

    return {
      employee: { ...employeeDoc, employeeID: employeeDoc._id.toString() },
    };
  } catch (error) {
    console.log({ err: error });
  }
};

let getEmployeeDetailsByAccountID = async ({ accountID }) => {
  try {
    let prom1 = await getEmployeeByAccountID({ accountID });

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

let getFlexibleAccessList = async ({
  filters: { accountID, employeeID, companyID, deptID },
}) => {
  try {
    let agg = [
      {
        $match: {
          $and: [
            {
              $expr: {
                $eq: [
                  "$accountID",
                  {
                    $ifNull: [accountID, "$accountID"],
                  },
                ],
              },
            },
            {
              $expr: {
                $eq: [
                  "$_id",
                  {
                    $ifNull: [ObjectId(employeeID), "$_id"],
                  },
                ],
              },
            },
            {
              $expr: {
                $eq: [
                  "$companyID",
                  {
                    $ifNull: [companyID, "$companyID"],
                  },
                ],
              },
            },
            {
              $expr: {
                $eq: [
                  "$deptID",
                  {
                    $ifNull: [deptID, "$deptID"],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $set: {
          deptIDAsObjectID: {
            $toObjectId: "$deptID",
          },
        },
      },
      {
        $set: {
          companyIDAsObjectID: {
            $toObjectId: "$companyID",
          },
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "companyIDAsObjectID",
          foreignField: "_id",
          as: "companies",
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "deptIDAsObjectID",
          foreignField: "_id",
          as: "departments",
        },
      },
      {
        $set: {
          companyInfo: {
            $first: "$companies",
          },
        },
      },
      {
        $set: {
          deptInfo: {
            $first: "$departments",
          },
        },
      },
      {
        $set: {
          flexible_access: {
            $ifNull: [
              {
                access_mode: {
                  $ifNull: [
                    {
                      $let: {
                        vars: {
                          flexible_access_mode: {
                            $first: {
                              $let: {
                                vars: {
                                  flexible_policy_filter: {
                                    $filter: {
                                      cond: {
                                        $eq: [
                                          "flexible_access_mode",
                                          "$$item.name",
                                        ],
                                      },
                                      input: "$deptInfo.dept_policies",
                                      as: "item",
                                    },
                                  },
                                },
                                in: "$$flexible_policy_filter",
                              },
                            },
                          },
                        },
                        in: "$$flexible_access_mode.value",
                      },
                    },
                    "$companyInfo.flexible_access.access_mode",
                  ],
                },
                access_value: {
                  $ifNull: [null, "$companyInfo.flexible_access.value"],
                },
              },
              {},
            ],
          },
        },
      },
      {
        $unset: ["companies", "deptIDAsObjectID", "companyIDAsObjectID"],
      },
    ];
    let cursor = await employeesCol.aggregate(agg);
    let employeesWithFlexibleAccessInfo = await cursor.toArray();
    return { employeesWithFlexibleAccessInfo };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getEmployeeFlexibleAccess = async ({
  filters: { accountID, employeeID, companyID, deptID },
}) => {
  try {
    let response = await getFlexibleAccessList({
      filters: { accountID, employeeID, companyID, deptID },
    });
    let { employeesWithFlexibleAccessInfo } = response;
    let employeeWithFlexibleAccessInfo = employeesWithFlexibleAccessInfo[0];
    if (!employeeWithFlexibleAccessInfo.flexible_access) {
      return { err: { msg: "Failed to compute flexible access" } };
    }
    return { flexible_access: employeeWithFlexibleAccessInfo.flexible_access };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getEmployeesWithdrawalHistory = async ({ filters = {} }) => {
  try {
    let {
      from,
      to,
      year,
      weekNumber,
      monthNumber,
      states,
      accountID,
      companyID,
      deptID,
      employeeID,
    } = filters;
    from = dateIsValid(new Date(from)) ? new Date(from) : new Date(0);
    to = dateIsValid(new Date(to)) ? new Date(to) : new Date(8640000000000000);
    year = !!Number(year) ? Number(year) : null;
    const agg = [
      {
        $match: {
          $and: [
            {
              $expr: {
                $eq: [
                  "$companyID",
                  {
                    $ifNull: [companyID, "$companyID"],
                  },
                ],
              },
            },
            {
              $expr: {
                $eq: [
                  "$_id",
                  {
                    $ifNull: [
                      ObjectID.isValid(employeeID)
                        ? ObjectID(employeeID)
                        : null,
                      "$_id",
                    ],
                  },
                ],
              },
            },
            {
              $expr: {
                $eq: [
                  "$accountID",
                  {
                    $ifNull: [accountID, "$accountID"],
                  },
                ],
              },
            },
            {
              $expr: {
                $eq: [
                  "$deptID",
                  {
                    $ifNull: [deptID, "$deptID"],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "withdrawals",
          localField: "accountID",
          foreignField: "accountID",
          as: "withdrawals",
        },
      },
      {
        $set: {
          completedWithdrawals: {
            $filter: {
              input: "$withdrawals",
              cond: {
                $and: [
                  {
                    $eq: ["$$withdrawal.status.name", "completed"],
                  },
                  {
                    $eq: [
                      {
                        $week: "$$withdrawal.status.updatedAt",
                      },
                      {
                        $ifNull: [
                          weekNumber,
                          {
                            $week: "$$withdrawal.status.updatedAt",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    $eq: [
                      {
                        $year: "$$withdrawal.status.updatedAt",
                      },
                      {
                        $ifNull: [
                          year,
                          {
                            $year: "$$withdrawal.status.updatedAt",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    $eq: [
                      {
                        $month: "$$withdrawal.status.updatedAt",
                      },
                      {
                        $ifNull: [
                          monthNumber,
                          {
                            $month: "$$withdrawal.status.updatedAt",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              as: "withdrawal",
            },
          },
        },
      },
      {
        $unwind: {
          path: "$completedWithdrawals",
        },
      },
    ];
    const cursor = await employeesCol.aggregate(agg);

    let histories = await cursor.toArray();
    let withdrawals = [];
    histories.forEach((hx) => {
      withdrawals.push(hx.completedWithdrawals);
    });
    return { withdrawal_history: histories };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

let getEmployeesTableInfo = async ({ filters }) => {
  try {
    
  let agg = composeGetEmployeeInfoTableAgg(filters);
  const cursor = await employeesCol.aggregate(agg);

  let employees_table_info = await cursor.toArray();
  return { employees_table_info,filters };
  } catch (error) {
    console.log(error);
    return {err:error}
  }
};

module.exports = {
  addEmployee,
  getEmployeesByCompanyID,
  getEmployeeByEmployeeID,
  getEmployeesByDepartmentID,
  getTotalSalaries,
  getEmployeeByAccountID,
  updateEmployeeInfo,
  checkIfEmployeePropExists,
  getEmployeeDetailsByAccountID,
  getEmployeeFlexibleAccess,
   getEmployeesTableInfo,
};
