const { ObjectID } = require("bson");
const { DateTime } = require("luxon");
const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const withdrawalsCol = db.collection("withdrawals");

let createWithdrawal = async ({
  accountID,
  employeeID,
  companyID,
  transactionInfo,
  transactionID,
  purpose = "employee_payment",
  status = "processing",
}) => {
  let result = await withdrawalsCol.insertOne({
    accountID,
    employeeID,
    companyID,
    transactionID,
    status,
    transactionInfo,
    type: purpose,
    lastModified: new Date(),
    createdOn: new Date(),
  });
  if (!result?.insertedId) {
    return { err: { msg: "No withdrawal created." } };
  }
  return { withdrawalID: result.insertedId.toString() };
};

/**
 *
 * @param {object} param0
 * @param {string} param0.transactionID
 * @param {object} param0.updates
 * @param {string} param0.updates.accountID
 * @param {number} param0.updates.amount
 * @param {"employee"|"employer"|"shared"} param0.updates.flexible_access
 * @param {number} param0.updates.withdrawal_fee
 * @param {"employee_payment"|"employer_payment"} param0.updates.type
 * @param {"initiated"|"processing"|"completed"|"failed"|"cancelled"} param0.updates.status
 * @returns
 */
let updateWithdrawalByTransactionID = async ({
  transactionID,
  updates: { status, type, withdrawal_fee, amount, flexible_access },
}) => {
  let result = await withdrawalsCol.findOneAndUpdate(
    { transactionID },
    [
      {
        $set: {
          status: {
            $cond: {
              if: {
                $and: [
                  status,
                  { $in: ["$status.name", ["initiated", "processing"]] },
                ],
              },
              then: { name: status, updatedAt: new Date() },
              else: "$status",
            },
          },
          tempStatus: "$status",
        },
      },
      {
        $set: {
          status_history: {
            $cond: {
              if: {
                $and: [status, { $ne: ["$tempStatus.name", status] }],
              },
              then: {
                $cond: {
                  if: { $and: ["$status_history"] },
                  then: {
                    $concatArrays: ["$status_history", ["$tempStatus"], ,],
                  },
                  else: ["$tempStatus"],
                },
              },
              else: {
                $ifNull: ["$status_history", [["$tempStatus"]]],
              },
            },
          },
        },
      },
      {
        $set: {
          lastModified: new Date(),
        },
      },
      /* {
        $unset: "tempStatus",
      },*/
    ],
    { returnDocument: "after" }
  );
  if (!result?.ok) {
    return { err: { msg: "No withdrawal created." } };
  }
  return { withdrawalID: result.value._id.toString() };
};

function dateIsValid(date) {
  return date instanceof Date && !isNaN(date);
}

let getEmployeeWithdrawalHistory = async ({ employeeID, filters = {} }) => {
  try {
    let { from, to, year, weekNumber, monthNumber, states } = filters;
    from = dateIsValid(new Date(from)) ? new Date(from) : new Date(0);
    to = dateIsValid(new Date(to)) ? new Date(to) : new Date(8640000000000000);
    const agg = [
      {
        $match: {
          $and: [
            {
              employeeID: "633235f93ad738e40fe5b59f",
            },
            /**
           month filter e.g lastModified at month 0-12
           */
            {
              $expr: {
                $eq: [
                  {
                    $month: "$lastModified",
                  },
                  {
                    $ifNull: [
                      monthNumber,
                      {
                        $month: "$lastModified",
                      },
                    ],
                  },
                ],
              },
            },
            /**
           week filter e.g lastModified at week 0-53
           */
            {
              $expr: {
                $eq: [
                  {
                    $week: "$lastModified",
                  },
                  {
                    $ifNull: [
                      weekNumber,
                      {
                        $week: "$lastModified",
                      },
                    ],
                  },
                ],
              },
            },
            /**
           range filter e.g lastModified between date A and date B
           */ {
              $expr: {
                $and: [
                  {
                    $gte: [
                      "$lastModified",
                      {
                        $ifNull: [from, "$lastModified"],
                      },
                    ],
                  },
                  {
                    $lte: [
                      "$lastModified",
                      {
                        $ifNull: [to, "$lastModified"],
                      },
                    ],
                  },
                ],
              },
            },
            /**
           status filter e.g status including [string a, string b]
           */
            {
              $expr: {
                $eq: [
                  true,
                  {
                    $in: [
                      "$status",
                      {
                        $ifNull: [
                          states,
                          ["initiated", "processing", "completed"],
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    ];

    const cursor = await withdrawalsCol.aggregate(agg);

    let history = await cursor.toArray();
    return { withdrawal_history: history };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getCompanyEmployeesWithdrawalHistory = async ({ filters = {} }) => {
  try {
    let { from, to, year, weekNumber, monthNumber, states } = filters;

    from = dateIsValid(new Date(from)) ? new Date(from) : new Date(0);
    to = dateIsValid(new Date(to)) ? new Date(to) : new Date(8640000000000000);
    const agg = [
      {
        $match: {
          $and: [
            /**
           month filter e.g lastModified at month 0-12
           */
            {
              $expr: {
                $eq: [
                  {
                    $month: "$lastModified",
                  },
                  {
                    $ifNull: [
                      monthNumber,
                      {
                        $month: "$lastModified",
                      },
                    ],
                  },
                ],
              },
            },
            /**
           week filter e.g lastModified at week 0-53
           */
            {
              $expr: {
                $eq: [
                  {
                    $week: "$lastModified",
                  },
                  {
                    $ifNull: [
                      weekNumber,
                      {
                        $week: "$lastModified",
                      },
                    ],
                  },
                ],
              },
            },
            /**
           range filter e.g lastModified between date A and date B
           */ {
              $expr: {
                $and: [
                  {
                    $gte: [
                      "$lastModified",
                      {
                        $ifNull: [from, "$lastModified"],
                      },
                    ],
                  },
                  {
                    $lte: [
                      "$lastModified",
                      {
                        $ifNull: [to, "$lastModified"],
                      },
                    ],
                  },
                ],
              },
            },
            /**
           status filter e.g status including [string a, string b]
           */
            {
              $expr: {
                $eq: [
                  true,
                  {
                    $in: [
                      "$status",
                      {
                        $ifNull: [
                          states,
                          ["initiated", "processing", "completed"],
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    ];
    const cursor = await withdrawalsCol.aggregate(agg);

    let history = await cursor.toArray();
    return { withdrawal_history: history };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  createWithdrawal,
  updateWithdrawalByTransactionID,
  getEmployeeWithdrawalHistory,
  getCompanyEmployeesWithdrawalHistory
};
