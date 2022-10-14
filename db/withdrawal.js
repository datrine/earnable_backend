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
  transactionID,salaryMonthID,salaryYearID ,
  purpose = "employee_payment",
  status ={name: "processing",updatedAt:new Date()},
}) => {
  let result = await withdrawalsCol.insertOne({
    accountID,
    employeeID,
    companyID,
    transactionID,
    status,salaryMonthID,salaryYearID ,
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

let getEmployeeWithdrawalHistory = async ({ employeeID, filters}) => {
  try {
   let {withdrawal_history}=await getWithdrawalHistory({filters:{...filters,employeeID}})
    return { withdrawal_history };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getWithdrawalHistory = async ({ filters }) => {
  try {
    let {
      from,
      to,
      year,
      weekNumber,
      monthNumber,
      states=["completed"],
      accountID,
      companyID,
      deptID,
      employeeID,
      withdrawalID,
    } = filters;
    from = dateIsValid(new Date(from)) ? new Date(from) : new Date(0);
    to = dateIsValid(new Date(to)) ? new Date(to) : new Date(8640000000000000);
    year = !!Number(year) ? Number(year) : null;
    weekNumber = !!Number(weekNumber) ? Number(weekNumber) : null;
    monthNumber = !!Number(monthNumber) ? Number(monthNumber) : null;
    const agg = [
      {
        $match: {
          $and: [
            {
              $expr: {
                $eq: [
                  "$_id",
                  {
                    $ifNull: [
                      ObjectID.isValid(withdrawalID)
                        ? ObjectID(withdrawalID)
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
                  "$employeeID",
                  {
                    $ifNull: [employeeID,
                      "$employeeID",
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
                   $and: [{
                    $in: ['$status.name',states]
                  }, {
                    $eq: [{
                      $week: '$status.updatedAt'
                    }, {
                      $ifNull: [weekNumber, {
                        $week: '$status.updatedAt'
                      }]
                    }]
                  }, {
                    $eq: [{
                      $year: '$status.updatedAt'
                    }, {
                      $ifNull: [year, {
                        $year: '$status.updatedAt'
                      }]
                    }]
                  }, {
                    $eq: [{
                      $month: '$status.updatedAt'
                    }, {
                      $ifNull: [monthNumber, {
                        $month: '$status.updatedAt'
                      }]
                    }]
                  }]
              }}
          ],
        },
      },
    ];
    const cursor = await withdrawalsCol.aggregate(agg);

    let withdrawals = await cursor.toArray();
    //console.log(withdrawals.length)
    return { withdrawal_history: withdrawals };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  createWithdrawal,
  updateWithdrawalByTransactionID,
  getEmployeeWithdrawalHistory,getWithdrawalHistory
};
