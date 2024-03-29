const { mongoClient } = require("../utils/conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const db = mongoClient.db(DB_NAME);
const transactionsCol = db.collection("transactions");
const { ObjectID } = require("bson");

let getTransactionsByFilters = async ({
  status,
  accountID,
  transfer_code,
  type,
  transfer_code_exists,
}) => {
  let aggr = [
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
                "$status.name",
                {
                  $ifNull: [status, "$status.name"],
                },
              ],
            },
          },
          {
            $expr: {
              $eq: [
                "$type",
                {
                  $ifNull: [type, "$type"],
                },
              ],
            },
          },
          {
            $expr: {
              $eq: [
                "$transfer_code",
                {
                  $ifNull: [transfer_code, "$transfer_code"],
                },
              ],
            },
          },
        ],
      },
    },
  ];
  let results = await transactionsCol.aggregate(aggr);
  let transactions = await results.toArray();
  return { transactions };
};

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

let createPayrollTransactionFromWallet = async ({
  employeeID,
  salaryMonthID,
  salaryYearID,
  companyID,
  accountID,
  recipient_code,
  amountToPay,
  type = "payroll_payment",
  session,
}) => {
  try {
    let result = await transactionsCol.insertOne(
      {
        employeeID,
        salaryMonthID,
        salaryYearID,
        companyID,
        accountID,
        recipient_code,
        amountToPay,
        type,
        status: {
          name: "initiated",
          updatedBy: accountID,
          updatedAt: new Date(),
        },
        processing_attempts: 1,
        status_history: [],
        lastModified: new Date(),
        createdOn: new Date(),
      },
      { session }
    );
    if (!result?.insertedId) {
      return { err: { msg: "No trasanction created." } };
    }
    return {
      transactionID: result.insertedId.toString(),
      salaryMonthID,
      companyID,
      salaryYearID,
      status: "initiated",
    };
  } catch (error) {
    console.log(error);
    return {
      err: error,
      salaryMonthID,
      companyID,
      salaryYearID,
      status: "failed",
    };
  }
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
    if (!transaction) {
      return { err: { msg: "Transaction does not exist." } };
    }
    return { transaction };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let updateTransactionByID = async ({
  transactionID,
  updates: { status, accountIDofUpdater, transfer_code },
  update_processing_attempts = true,
}) => {
  try {
    const result = await transactionsCol.findOneAndUpdate(
      { _id: ObjectID(transactionID) },
      [
        {
          $set: {
            transfer_code: {
              $cond: {
                if: {
                  $eq: ["$status.name", "processing"],
                },
                then: { $ifNull: ["$transfer_code", transfer_code] },
                else: "$transfer_code",
              },
            },
          },
        },
        {
          $set: {
            processing_attempts: {
              $cond: {
                if: {
                  $and: [
                    {
                      update_processing_attempts,
                    },
                    {
                      $eq: ["$status.name", "processing"],
                    },
                  ],
                },
                then: { $sum: [{ $ifNull: ["$processing_attempts", 0] }, 1] },
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
                    status,
                    { $in: ["$status.name", ["initiated", "processing"]] },
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
                    if: { $and: ["$status_history"] },
                    then: {
                      $concatArrays: ["$status_history", ["$tempStatus"]],
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
    return { info: result.ok, value: result.value };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getTransactionsByAccountID = async ({
  salaryMonthID,
  salaryYearID,
  status_name,
  accountID,
}) => {
  try {
    let agg = [
      {
        $set: {
          transactionID: {
            $toString: "$_id",
          },
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "accountID",
          foreignField: "accountID",
          as: "account",
        },
      },
      {
        $set: {
          accountObject: {
            $first: "$account",
          },
        },
      },
      {
        $lookup: {
          from: "withdrawals",
          localField: "transactionID",
          foreignField: "transactionID",
          as: "withdrawals",
        },
      },
      {
        $set: {
          withdrawalObject: {
            $first: "$withdrawals",
          },
        },
      },
      {
        $set: {
          companyIDAsObjectID: {
            $toObjectId: "$withdrawalObject.companyID",
          },
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "companyIDAsObjectID",
          foreignField: "_id",
          as: "companyObject",
        },
      },
      {
        $set: {
          companyObject: {
            $first: "$companyObject",
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $ifNull: [accountID, "$accountObject.accountID"],
                  },
                  "$accountObject.accountID",
                ],
              },
              {
                $eq: [
                  {
                    $ifNull: [status_name, "$status.name"],
                  },
                  "$status.name",
                ],
              },
              {
                $eq: [
                  {
                    $ifNull: [salaryMonthID, "$withdrawalObject.salaryMonthID"],
                  },
                  "$withdrawalObject.salaryMonthID",
                ],
              },
              {
                $eq: [
                  {
                    $ifNull: [salaryYearID, "$withdrawalObject.salaryYearID"],
                  },
                  "$withdrawalObject.salaryYearID",
                ],
              },
            ],
          },
        },
      },
    ];
    const result = await transactionsCol.find({ accountID });
    const transactions = await result.toArray();
    return { info: result.ok, transactions };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let updateTransactionByTransactionReference = async ({
  transaction_reference,
  updates: { status, accountIDofUpdater },
  update_processing_attempts = true,
}) => {
  try {
    const result = await transactionsCol.findOneAndUpdate(
      { transaction_reference },
      [
        {
          $set: {
            processing_attempts: {
              $cond: {
                if: {
                  $and: [
                    {
                      update_processing_attempts,
                    },
                    {
                      $eq: ["$status.name", "processing"],
                    },
                  ],
                },
                then: { $sum: [{ $ifNull: ["$processing_attempts", 0] }, 1] },
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
                    status,
                    { $in: ["$status.name", ["initiated", "processing"]] },
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
                    if: { $and: ["$status_history"] },
                    then: {
                      $concatArrays: ["$status_history", ["$tempStatus"]],
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
    if (!result.ok) {
      return { err: { msg: "Failed to update transaction." } };
    }
    return { info: "Updated", value: result.value };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

module.exports = {
  getTransactionsByCompanyID,
  createTransaction,
  getTransactionByTransactionID,
  getTransactionByID,
  updateTransactionByID,
  getTransactionsByFilters,
  updateTransactionByTransactionReference,
  createPayrollTransactionFromWallet,
  getTransactionsByAccountID,
};
