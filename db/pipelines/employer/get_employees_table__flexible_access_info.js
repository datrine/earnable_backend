const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let composeGetEmployeesFlexibleAccessInfoTableAgg = ({
  companyID,
  deptID,
  employeeID,
  from,
  to,
  enrollment_state,
  year = DateTime.now().year,
  weekNumber,
  accountID,
  monthNumber = DateTime.now().month,
}) => {
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
                    ObjectId.isValid(employeeID)
                      ? ObjectId(employeeID)
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
      $lookup: {
        from: "withdrawals",
        localField: "accountID",
        foreignField: "accountID",
        as: "withdrawals",
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
        employeeID:{$toString:"$_id"},
        userInfo: { $first: "$users" },
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
                {
                  $and: [
                    {
                      $lte: [
                        {
                          $ifNull: [from, "$$withdrawal.status.updatedAt"],
                        },
                        "$$withdrawal.status.updatedAt",
                      ],
                    },
                    {
                      $gte: [
                        {
                          $ifNull: [to, "$$withdrawal.status.updatedAt"],
                        },
                        "$$withdrawal.status.updatedAt",
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
        path: "$filteredWithdrawals",
      },
    },
    {
      $set: {
        filteredWithdrawal: "$filteredWithdrawals",
      },
    },
    {
      $set: {
        full_name: { $concat: ["$userInfo.f_name", " ", "$userInfo.l_name"] },
        time: "$filteredWithdrawal.status.updatedAt",
        date: "$filteredWithdrawal.status.updatedAt",
        withdrawal_fee_by_employer:
          "$filteredWithdrawal.transactionInfo.withdrawal_fee_by_employer",
        withdrawal_fee_by_employee:
          "$filteredWithdrawal.transactionInfo.withdrawal_fee_by_employee",
        withdrawal_charge_mode:
          "$filteredWithdrawal.transactionInfo.withdrawal_charge_mode",
        amount_withdrawn:
          "$filteredWithdrawal.transactionInfo.netAmountToWithdraw",
      },
    },
  ];
  return agg;
};

module.exports = composeGetEmployeesFlexibleAccessInfoTableAgg;
