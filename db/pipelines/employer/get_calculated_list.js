const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let composeGetCalculatedListAgg = (filters) => {
  let {
    companyID,
    deptID,
    employeeID,
    from,
    to,
    withdrawal_states = ["completed"],
    year = DateTime.now().year,
    weekNumber,
    accountID,
    monthNumber = DateTime.now().month,
  } = filters;
  (withdrawal_states =
    Array.isArray(withdrawal_states) && withdrawal_states.length > 0
      ? withdrawal_states
      : null),
    (from = !!from
      ? DateTime.isDateTime(DateTime.fromISO(from))
        ? new Date(from)
        : null
      : null);
  to = !!to
    ? DateTime.isDateTime(DateTime.fromISO(to))
      ? new Date(to)
      : null
    : null;
  console.log({ to, from });
  let agg = [
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
                    ObjectId.isValid(employeeID) ? ObjectId(employeeID) : null,
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
          {
            $expr: {
              $eq: ["$enrollment_state.state", "enrolled"],
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
        from: "accounts",
        localField: "accountID",
        foreignField: "accountID",
        as: "accounts",
      },
    },
    {
      $lookup: {
        from: "bank_details",
        localField: "accountID",
        foreignField: "accountID",
        as: "bankDetails",
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
        from: "users",
        localField: "accountID",
        foreignField: "accountID",
        as: "users",
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
        bankDetail: {
          $first: "$bankDetails",
        },
        userInfo: {
          $first: "$users",
        },
        accountInfo: {
          $first: "$accounts",
        },
      },
    },
    {
      $set: {
        acc_number: "$bankDetail.acc_number",
        acc_name: "$bankDetail.acc_name",
        bank_name: "$bankDetail.bank_name",
        bank_code: "$bankDetail.bank_code",
        full_name: {
          $concat: ["$userInfo.f_name", " ", "$userInfo.l_name"],
        },
        f_name: "$userInfo.f_name",
        l_name: "$userInfo.l_name",
        email: "$accountInfo.email",
        phonenum: "$accountInfo.phonenum",
        enrollment_status: "$enrollment_state.state",
        resolvedFlexibleAccess: {
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
                  $in: ["$$withdrawal.status.name", ["completed"]],
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
                {
                  $lte: [
                    { $ifNull: [from, "$$withdrawal.status.updatedAt"] },
                    "$$withdrawal.status.updatedAt",
                  ],
                },
                {
                  $gte: [
                    { $ifNull: [to, "$$withdrawal.status.updatedAt"] },
                    "$$withdrawal.status.updatedAt",
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
        resolvedFlexibleAccessValue: "$resolvedFlexibleAccess.access_value",
        resolvedflexibleAccessMode: "$resolvedFlexibleAccess.access_mode",
        filteredWithdrawalCount: {
          $size: "$filteredWithdrawals",
        },
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
              $divide: ["$resolvedFlexibleAccess.access_value", 100],
            },
          ],
        },
        sumWithdrawalFees: {
          $reduce: {
            input: "$filteredWithdrawals",
            initialValue: 0,
            in: {
              $sum: ["$$value", "$$this.transactionInfo.withdrawal_fee"],
            },
          },
        },
        sumWithdrawalFeesByEmployee: {
          $reduce: {
            input: "$filteredWithdrawals",
            initialValue: 0,
            in: {
              $sum: [
                "$$value",
                "$$this.transactionInfo.withdrawal_fee_by_employee",
              ],
            },
          },
        },
        sumWithdrawalFeesByEmployer: {
          $reduce: {
            input: "$filteredWithdrawals",
            initialValue: 0,
            in: {
              $sum: [
                "$$value",
                "$$this.transactionInfo.withdrawal_fee_by_employer",
              ],
            },
          },
        },
        date: {
          $last: "$filteredWithdrawals.status.updatedAt",
        },
        time: {
          $last: "$filteredWithdrawals.status.updatedAt",
        },
      },
    },
    {
      $set: {
        monthly_salary: {
          $toDouble: "$monthly_salary",
        },
        employeeAvailableFlexibleAccess: {
          $subtract: ["$employeeTotalFlexibleAccess", "$sumWithdrawal"],
        },
      },
    },
    {
      $set: {
        employeeTotalNetPay: {
          $add: [
            {
              $subtract: [
                {
                  $toDouble: "$monthly_salary",
                },
                "$employeeTotalFlexibleAccess",
              ],
            },
            "$employeeAvailableFlexibleAccess",
          ],
        },
        employeeReconciledDebt: {
          $sum: ["$sumWithdrawal", "$sumWithdrawalFeesByEmployer"],
        },
      },
    },
    {
      $unset: [
        "users",
        "accounts",
        "withdrawals",
        "bankDetails",
        "companies",
        "departments",
        "deptInfo",
        "accountInfo",
        "userInfo",
        "bankDetail",
        "companyInfo",
        "filteredWithdrawals",
        "deptIDAsObjectID",
        "companyIDAsObjectID",
      ],
    },
  ];

  return agg;
};

module.exports = composeGetCalculatedListAgg;
