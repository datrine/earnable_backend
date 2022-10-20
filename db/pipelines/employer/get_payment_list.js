const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let getPaymentListAgg = ({ companyID }) => {
  let agg = [
    {
      $set: {
        companyID: {
          $toString: "$_id",
        },
      },
    },
    {
      $lookup: {
        from: "refunds",
        localField: "companyID",
        foreignField: "companyID",
        as: "refund",
      },
    },
    {
      $unwind: {
        path: "$refund",
      },
    },
    {
      $match: {
        "refund.status.name": "completed",
      },
    },
    {
      $group: {
        _id: {
          companyID: "$companyID",
          salaryMonthID: "$salaryMonthID",
          salaryYearID: "$salaryYearID",
        },
        companyID: {
          $first: "$companyID",
        },
        salaryMonthID: {
          $first: "$salaryMonthID",
        },
        salaryYearID: {
          $first: "$salaryYearID",
        },
        prev_salary_date: {
          $first: "$prev_salary_date",
        },
        next_salary_date: {
          $first: "$next_salary_date",
        },
        accumulatedRefund: {
          $sum: "$refund.amount_refunded",
        },
        lastRefundDate: {
          $last: "$refund.status.updatedAt",
        },
      },
    },
    {
      $lookup: {
        from: "withdrawals",
        localField: "companyID",
        foreignField: "companyID",
        as: "withdrawals",
      },
    },
    {
      $set: {
        filteredWithdrawals: {
          $filter: {
            input: "$withdrawals",
            cond: {
              $and: [
                {
                  $eq: ["completed", "$$item.status.name"],
                },
                {
                  $eq: ["$salaryMonthID", "$$item.salaryMonthID"],
                },
                {
                  $eq: ["$salaryYearID", "$$item.salaryYearID"],
                },
              ],
            },
            as: "item",
          },
        },
      },
    },
    {
      $set: {
        sumFilteredWithdrawals: {
          $reduce: {
            input: "$filteredWithdrawals",
            initialValue: 0,
            in: {
              $add: ["$$value", "$$this.transactionInfo.netAmountToWithdraw"],
            },
          },
        },
        sumFilteredWithdrawalFees: {
          $reduce: {
            input: "$filteredWithdrawals",
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                "$$this.transactionInfo.withdrawal_fee_by_employer",
              ],
            },
          },
        },
      },
    },
    {
      $set: {
        sumFilteredTotalDebts: {
          $add: ["$sumFilteredWithdrawals", "$sumFilteredWithdrawalFees"],
        },
      },
    },
    {
      $set: {
        paymentState: {
          $cond: {
            if: {
              $lt: ["$sumFilteredTotalDebts", "$accumulatedRefund"],
            },
            then: "paid",
            else: {
              $cond: {
                if: {
                  $gt: ["$accumulatedRefund", 0],
                },
                then: "incomplete_payment",
                else: "unpaid",
              },
            },
          },
        },
      },
    },
  ];
  return agg;
};

module.exports = getPaymentListAgg;
