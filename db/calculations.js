const { ObjectID } = require("bson");
const { DateTime } = require("luxon");
const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const { employerPipelines:{composeGetEmployeeInfoTableAgg} } = require("./pipelines");
const db = clientConn.db("waleprj");
const employeesCol = db.collection("employees");

function dateIsValid(date) {
  return date instanceof Date && !isNaN(date);
}

let getEmployeesSumOfWithdrawn = async ({ filters = {} }) => {
  try {
    let {
      from,
      to,
      year = DateTime.now().year,
      weekNumber,
      accountID,
      monthNumber = DateTime.now().month,
      companyID,
      deptID,
    } = filters;

    from = dateIsValid(new Date(from)) ? new Date(from) : new Date(0);
    to = dateIsValid(new Date(to)) ? new Date(to) : new Date(8640000000000000);
    const agg = [
      {
        $match: {
          $and: [
            {
              $expr: {
                $eq: ["$companyID", { $ifNull: [companyID, "$companyID"] }],
              },
            },
            { $expr: { $eq: ["$_id", { $ifNull: [null, "$_id"] }] } },
            {
              $expr: {
                $eq: ["$accountID", { $ifNull: [accountID, "$accountID"] }],
              },
            },
            { $expr: { $eq: ["$deptID", { $ifNull: [deptID, "$deptID"] }] } },
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
        $addFields: {
          filteredWithdrawals: {
            $filter: {
              input: "$withdrawals",
              cond: {
                $and: [
                  { $eq: ["$$withdrawal.status.name", "completed"] },
                  {
                    $eq: [
                      { $week: "$$withdrawal.status.updatedAt" },
                      {
                        $ifNull: [
                          weekNumber,
                          { $week: "$$withdrawal.status.updatedAt" },
                        ],
                      },
                    ],
                  },
                  {
                    $eq: [
                      { $year: "$$withdrawal.status.updatedAt" },
                      {
                        $ifNull: [
                          year,
                          { $year: "$$withdrawal.status.updatedAt" },
                        ],
                      },
                    ],
                  },
                  {
                    $eq: [
                      { $month: "$$withdrawal.status.updatedAt" },
                      {
                        $ifNull: [
                          monthNumber,
                          { $month: "$$withdrawal.status.updatedAt" },
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
        $set: {
          sumWithdrawal: {
            $reduce: {
              input: "$filteredWithdrawals",
              initialValue: 0,
              in: {
                $sum: ["$$value", "$$this.transactionInfo.netAmountToWithdraw"],
              },
            },
          },
        },
      },
    ];
    const cursor = await employeesCol.aggregate(agg);
    let preSumList = await cursor.toArray();
    let totalFlexibleWithdrawal = preSumList
      .map((obj) => ({ sumWithdrawal: obj.sumWithdrawal }))
      .reduce((prev, obj) => prev + obj.sumWithdrawal, 0);
    return { totalFlexibleWithdrawal, filters };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

let getTotalFlexibleAccess = async ({
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
      {
        $set: {
          employeeTotalFlexibleAccess: {
            $multiply: [
              {
                $toInt: "$monthly_salary",
              },
              {
                $divide: ["$flexible_access.access_value", 100],
              },
            ],
          },
        },
      },
      /**/ {
        $group: {
          _id: null,
          employeesTotalFlexibleAccess: {
            $sum: "$employeeTotalFlexibleAccess",
          },
        },
      },
    ];
    let cursor = await employeesCol.aggregate(agg);
    let docs = await cursor.toArray();
    let {employeesTotalFlexibleAccess :totalFlexibleAccess } = docs[0];
    return { totalFlexibleAccess };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getTotalNetPayMethod1 = async ({ filters }) => {
  try {
    let promises = await Promise.allSettled([
      getEmployeesSumOfWithdrawn({ filters }),
      getTotalFlexibleAccess({ filters }),
    ]);
    let totalFlexibleWithdrawal = 0;
    let employeesTotalFlexibleAccess = 0;
    for (const promResult of promises) {
      if (promResult.status === "rejected") {
        return { err: promResult.reason };
      } else if (promResult.value.err) {
        return { err: promResult.value.err };
      }
      if (promResult.value.employeesTotalFlexibleAccess) {
        employeesTotalFlexibleAccess =
          promResult.value.employeesTotalFlexibleAccess;
      }
      if (promResult.value.totalFlexibleWithdrawal) {
        totalFlexibleWithdrawal = promResult.value.totalFlexibleWithdrawal;
      }
    }
    let totalNetPay = employeesTotalFlexibleAccess - totalFlexibleWithdrawal;
    return { totalNetPay };
  } catch (error) {
    console.log(error);
  }
};

let getTotalNetPayMethod2 = async ({ filters = {} }) => {
  try {
    let {
      from,
      to,
      year = DateTime.now().year,
      weekNumber,
      accountID,
      monthNumber = DateTime.now().month,
      companyID,
      employeeID,
      deptID,
    } = filters;

    from = dateIsValid(new Date(from)) ? new Date(from) : new Date(0);
    to = dateIsValid(new Date(to)) ? new Date(to) : new Date(8640000000000000);
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
                        : employeeID,
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
        $set: {
          deptIDAsObjectID: {
            $toObjectId: "$deptID",
          },
          companyIDAsObjectID: {
            $toObjectId: "$companyID",
          },
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
          filteredWithdrawals: {
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
        $set: {
          sumWithdrawal: {
            $reduce: {
              input: "$filteredWithdrawals",
              initialValue: 0,
              in: {
                $sum: ["$$value", "$$this.transactionInfo.netAmountToWithdraw"],
              },
            },
          },
          employeeTotalFlexibleAccess: {
            $multiply: [
              {
                $toInt: "$monthly_salary",
              },
              {
                $divide: ["$flexible_access.access_value", 100],
              },
            ],
          },
        },
      },
      {
        $set: {
          employeeTotalNetPay: {
            $subtract: ["$employeeTotalFlexibleAccess", "$sumWithdrawal"],
          },
        },
      },
    ];

    const cursor = await employeesCol.aggregate(agg);
    let preSumList = await cursor.toArray();
    let totalNetPay = preSumList.reduce(
      (prev, obj) => prev + obj.employeeTotalNetPay,
      0
    );
    return { totalNetPay, filters };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

let getEmployeeNetEarning = async ({ filters = {} }) => {
  try {
    if (!filters?.employeeID) {
      
    }
   let response=await getTotalNetPayMethod2({filters});
   console.log(response)
    return { ...response };
  } catch (error) {
    console.log(error);
    throw error;
  }
};


module.exports = {
  getEmployeesSumOfWithdrawn,
  getTotalFlexibleAccess,
  getTotalNetPayMethod1,
  getTotalNetPay: getTotalNetPayMethod2,getEmployeeNetEarning
};
