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
 * @param {string} param0.accountID
 * @param {number} param0.amount
 * @param {"employee"|"employer"|"shared"} param0.withdrawal_charge_moded
 * @param {number} param0.withdrawal_fee
 * @param {"employee_payment"|"employer_payment"} param0.type
 * @param {"initiated"|"processing"|"success"|"failed"} param0.status
 * @returns
 */
let updateWithdrawalByTransactionID = async ({ transactionID, ...updates }) => {
  let result = await withdrawalsCol.findOneAndUpdate(
    {
      transactionID,
    },
    {
      $set: {
        ...updates,
        lastModified: new Date(),
      },
    }
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
  getCompanyEmployeesWithdrawalHistory,
};
