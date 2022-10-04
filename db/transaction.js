const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const transactionsCol = db.collection("transactions");
const { ObjectID } = require("bson");
const { verifyTransfer } = require("./bank_detail");
const { transferVerifyResponseObj } = require("./templates/paystack/responses");
const {
  createWithdrawal,
  updateWithdrawalByTransactionID,
} = require("./withdrawal");
const { getEmployeeByAccountID } = require("./employee");
const { registerJob } = require("../jobs");
const { CronJob } = require("cron");

let getTransactionsByCompanyID = async (companyID) => {
  let results = await transactionsCol.find({
    companyID,
  });
  let transactions = await results.toArray();
  return { transactions };
};

let getTransactionByTransactionID = async ({ transactionID, ...updates }) => {
  try {
    let transaction = await transactionsCol.findOne({
      _id: ObjectID(transactionID),
    });
    if (!transaction) {
      return { err: { msg: `Transaction ${transactionID}` } };
    }
    return { transaction };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let updateTransactionByTransactionID = async ({
  transactionID,
  ...updates
}) => {
  let result = await transactionsCol.findOneAndUpdate(
    {
      _id: ObjectID(transactionID),
    },
    { $set: { ...updates, lastModified: new Date() } }
  );
  if (!result.ok) {
    return { err: { msg: `Failed to update transaction ${transactionID}` } };
  }
  return { info: "Transaction updated" };
};

let updateAndReturnTransactionByTransactionID = async ({
  transactionID,
  ...updates
}) => {
  let result = await transactionsCol.findOneAndUpdate(
    {
      _id: ObjectID(transactionID),
    },
    { $set: { ...updates, lastModified: new Date() } },
    { returnDocument: "after" }
  );
  if (!result.ok) {
    return { err: { msg: `Failed to update transaction ${transactionID}` } };
  }
  return { info: "Transaction updated", transaction: result.value };
};

let createTransaction = async ({ ...data }) => {
  if (!data.accountID) {
    return { err: { msg: "Account ID not supplied" } };
  }
  let result = await transactionsCol.insertOne({
    ...data,
    status: {
      name: "initiated",
      updatedBy: data.accountID,
      updatedAt: new Date(),
    },
    lastModified: new Date(),
    createdOn: new Date(),
  });
  if (!result?.insertedId) {
    return { err: { msg: "No trasanction created." } };
  }
  return { transactionID: result.insertedId.toString() };
};

let getTransactionByID = async ({ transactionID }) => {
  try {
    const transaction = await transactionsCol.findOne({
      _id: ObjectID(transactionID),
    });
    return { transaction };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let updateTransactionByID = async ({
  transactionID,
  updates: { status, accountIDofUpdater, },
  update_processing_attempts = true,
}) => {
  try {
    const result = await transactionsCol.findOneAndUpdate(
      { _id: ObjectID(transactionID) },
      [
        {
          $set: {
            processing_attempts: {
              $cond: {
                if: {
                  $and: [
                    {
                      update_processing_attempts,
                      $eq: ["$status.name", "processing"],
                    },
                  ],
                },
                then: { $add: [{ $ifNull: ["$processing_attempts", 0] }, 1] },
                else: "$processing_attempts",
              },
            },
          },
        },
        {
          $set: {
            status: {
              $cond: {
                if: {
                  $and: [
                    "status.name",
                    { $in: ["$status.name", ["initiated"]] },
                  ],
                },
                then: {
                  name: status,
                  updatedBy: accountIDofUpdater,
                  updatedAt: new Date(),
                },
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
                    if: "$status_history",
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
        {
          $unset: "tempStatus",
        },
      ],
      { returnDocument: "after" }
    );
    //console.log(transaction);
    result.ok;
    return { info: result.ok, value: result.value };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

module.exports = {
  getTransactionsByCompanyID,
  createTransaction,
  getTransactionByTransactionID,
  updateTransactionByTransactionID,
  updateAndReturnTransactionByTransactionID,
  getTransactionByID,
  updateTransactionByID,
};
