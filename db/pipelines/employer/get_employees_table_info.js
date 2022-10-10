const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let composeGetEmployeeInfoTableAgg = ({
  companyID,
  deptID,
  employeeID,
  from,
  to,enrollment_state,
  year = DateTime.now().year,
  weekNumber,
  accountID,
  withdrawal_states,
  monthNumber = DateTime.now().month,
}) => {
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
          {
            $expr: {
              $eq: [
                "$_id",
                {
                  $ifNull: [ObjectId.isValid(employeeID)?ObjectId(employeeID):employeeID , "$_id"],
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
      $lookup: {
        from: "accounts",
        localField: "accountID",
        foreignField: "accountID",
        as: "accounts",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "accountID",
        foreignField: "accountID",
        as: "users",
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
        deptInfo: {
          $first: "$departments",
        },
        companyInfo: {
          $first: "$companies",
        },
        accountInfo: {
          $first: "$accounts",
        },
        userInfo: {
          $first: "$users",
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
                  $in: ["$$withdrawal.status.name",{$ifNull:[withdrawal_states,["completed"]] }],
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
        full_name: {
          $concat: ["$userInfo.f_name", " ", "$userInfo.l_name"],
        },
        department: "$deptInfo.dept_name",
        phonenum: "$accountInfo.phonenum",
        monthly_salary: {
          $toInt: "$monthly_salary",
        },
        enrollment_state: "$enrollment_state.state",
        account_state: "$accountInfo.activity.current.name",
      },
    },{$match:{
      $expr:{
        $eq:["$enrollment_state",{$ifNull:[enrollment_state,"$enrollment_state"]}]
      }
    }},
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
    {
      $unset: [
        "filteredWithdrawals",
        "userInfo",
        "users",
        "companies",
        "companyInfo",
        "deptInfo",
        "departments",
        "accounts",
        "accountInfo",
        "withdrawals",
      ],
    },
  ];
  return agg;
};

module.exports=composeGetEmployeeInfoTableAgg
