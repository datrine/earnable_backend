const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let composeGetDebtListAgg = (filters) => {
  let {
    companyID,
    deptID,
    from,
    to,
    withdrawal_states = ["completed"],
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
  //console.log({ companyID });
  let agg = [
    {
      $match: {
        $expr: {
          $and: [{ $eq: [companyID, { $toString: "$_id" }] }],
        },
      },
    },
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
        as: "refundInfo",
      },
    },
    {
      $unwind: {
        path: "$refundInfo",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $set: {
        fromDate: {
          $dateSubtract: {
            startDate: {
              $dateFromParts: {
                year: {
                  $year: "$refundInfo.status.updatedAt",
                },
                month: {
                  $month: "$refundInfo.status.updatedAt",
                },
                day: {
                  $toInt: "$salary_date",
                }
              },
            },
            unit: "month",
            amount: 1,
          },
        },
        toDate: {
          $dateFromParts: {
            year: {
              $year: "$refundInfo.status.updatedAt",
            },
            month: {
              $month: "$refundInfo.status.updatedAt",
            },
            day: {
              $toInt: "$salary_date",
            },
           /* hour: {
              $hour: "$refundInfo.status.updatedAt",
            },
            minute: {
              $minute: "$refundInfo.status.updatedAt",
            },
            second: {
              $second: "$refundInfo.status.updatedAt",
            },*/
          },
        },
      },
    },
    {
      $group: {
        _id: {
          companyID: "$companyID",
          fromDate: "$fromDate",
          toDate: "$toDate",
        },
        accumulatedRefundedAmount: {
          $sum: "$refundInfo.amount_refunded",
        },
        companyID: {
          $first: "$companyID",
        },
        monthNumber: {
          $first: {
            $month: "$toDate",
          },
        },
        yearId: {
          $first: {
            $year: "$toDate",
          },
        },
        fromDate: {
          $first: "$fromDate",
        },
        toDate: {
          $first: "$toDate",
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
                  $eq: ["completed", "$$withdrawal.status.name"],
                },
                {
                  $lte: ["$fromDate", "$$withdrawal.status.updatedAt"],
                },
                {
                  $gte: ["$toDate", "$$withdrawal.status.updatedAt"],
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
        totalFilteredWithdrawalRefunds: {
          $reduce: {
            input: "$filteredWithdrawals",
            initialValue: 0,
            in: {
              $sum: ["$$value", "$$this.transactionInfo.netAmountToWithdraw"],
            },
          },
        },
        totalFilteredWithdrawalFeeByEmployer: {
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
      },
    },
    {
      $set: {
        totalFilteredDebtToPay: {
          $sum: [
            "$totalFilteredWithdrawalRefunds",
            "$totalFilteredWithdrawalFeeByEmployer",
          ],
        },
      },
    },
  ];

  return agg;
};

module.exports = composeGetDebtListAgg;
