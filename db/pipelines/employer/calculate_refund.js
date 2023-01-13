const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let calculateRefundAgg = ({ companyID, salaryMonthID, salaryYearID }) => {
  let agg = [
    {
      $match: {
        $expr: {
          $and: [
            {
              $eq: ["$companyID", companyID],
            },
            {
              $eq: ["$status.name", "completed"],
            },
            {
              $eq: [
                { $ifNull: [salaryMonthID, "$salaryMonthID"] },
                "$salaryMonthID",
              ],
            },
            {
              $eq: [
                { $ifNull: [salaryYearID, "$salaryYearID"] },
                "$salaryYearID",
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        grossAmountToRefund: {
          $sum: "$amount_refunded",
        },
        companyID: {
          $first: "$companyID",
        },
      },
    },
    {
      $lookup: {
        from: "withdrawals",
        localField: "companyID",
        foreignField: "companyID",
        as: "withdrawal",
      },
    },
    {
      $unwind: {
        path: "$withdrawal",
      },
    },
    {
      $match: {
        "withdrawal.status.name": "completed",
      },
    },
    {
      $group: {
        _id: null,
        grossAmountToRefund: {
          $first: "$grossAmountToRefund",
        },
        sumWithdrawals: {
          $sum: {
            $add: [
              "$withdrawal.transactionInfo.netAmountToWithdraw",
              "$withdrawal.transactionInfo.withdrawal_fee_by_employer",
            ],
          },
        },
      },
    },
    {
      $set: {
        netAmountToRefund: {
          $subtract: ["$sumWithdrawals", "$grossAmountToRefund"],
        },
      },
    },
  ];
  return agg;
};

module.exports = calculateRefundAgg;
