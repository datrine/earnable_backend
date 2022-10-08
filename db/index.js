const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const transactionsCol = waleprjDB.collection("transactions");
const bank_detailsCol = waleprjDB.collection("bank_details");
const { employeeTemplate, bankDetailsTemplate } = require("./templates");
const { updateEmployeeInfo, getEmployeeByEmployeeID } = require("./employee");
const { retrieveAccountInfoByAccountID } = require("./account");
const {
  getBankDetailsByAccountID,
  createRecipientCode,
  updateRecieptCodeEmployeeID,
  verifyTransfer,
  initiateTransfer,
} = require("./bank_detail");
const { CronJob } = require("cron");
const { registerJob } = require("../jobs");
const {
  updateTransactionByID,
  getTransactionsByFilters,
} = require("./transaction");

const { updateWithdrawalByTransactionID } = require("./withdrawal");
const { getEmployeesSumOfWithdrawn } = require("./calculations");
const { DateTime } = require("luxon");

let attemptChangeEnrollmentStatus = async ({
  accountID,
  employeeID,
  enrollment_status,
}) => {
  try {
    //check if employee is active
    let [accountResult, bankDetailsResult, employeeResult] =
      await Promise.allSettled([
        await retrieveAccountInfoByAccountID(accountID),
        await getBankDetailsByAccountID({ accountID }),
        await getEmployeeByEmployeeID({ employeeID }),
      ]);
    if (
      accountResult.status === "rejected" ||
      bankDetailsResult.status === "rejected" ||
      employeeResult.status === "rejected"
    ) {
      return { err: { msg: "Error: Failed to verify critical information" } };
    }
    let accountErr = accountResult.value.err;
    let account = accountResult.value.account;
    if (accountErr) {
      return accountErr;
    }

    let bankDetailsErr = bankDetailsResult.value.err;
    let bankDetails = bankDetailsResult.value.bankDetails;
    if (bankDetailsErr) {
      return bankDetailsErr;
    }

    let employeeErr = employeeResult.value.err;
    let employee = employeeResult.value.employee;
    if (employeeErr) {
      return employeeErr;
    }

    if (enrollment_status === "enrolled") {
      if (
        !(
          account.acc_type === "employee" ||
          account.activity.current.name === "active" ||
          bankDetails.acc_number ||
          bankDetails.recipient_code
        )
      ) {
        enrollment_status = "pending";
        let response = await updateEmployeeInfo({
          employeeID,
          enrollment_status,
        });
        return { ...response, enrollment_status };
      } else {
        enrollment_status = "enrolled";
        let response = await updateEmployeeInfo({
          employeeID,
          enrollment_status,
        });
        return { ...response, enrollment_status };
      }
    } else if (enrollment_status === "unenrolled") {
      let response = await updateEmployeeInfo({
        employeeID,
        enrollment_status,
      });
      return { ...response, enrollment_status };
    }
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let attemptChangeEnrollmentStatusCronJob = async () => {
  try {
    const agg = [
      {
        $match: {
          "enrollment_state.state": "pending",
        },
      },
    ];
    const cursor = employeesCol.aggregate(agg);
    /**
     * @type {[employeeTemplate]}
     */
    const result = await cursor.toArray();
    let toGoArray = result
      .map((obj) => ({
        accountID: obj.accountID,
        employeeID: obj._id.toString(),
        enrollment_status: obj.enrollment_state.state,
      }))
      .filter((obj) => obj.enrollment_status === "pending")
      .map((obj) => ({ ...obj, enrollment_status: "enrolled" }));
    await Promise.allSettled([
      ...toGoArray.map((obj) => attemptChangeEnrollmentStatus(obj)),
    ]);
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let attemptReInitiateTransferCronJob = async () => {
  try {
    const agg = [
      {
        $match: {
          "status.name": "processing",
          "status.transfer_code": { $exists: false },
          $or: [
            {
              processing_attempts: {
                $lt: 4,
              },
            },
            {
              processing_attempts: {
                $exists: false,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "bank_details",
          localField: "accountID",
          foreignField: "accountID",
          as: "uuu",
        },
      },
      {
        $addFields: {
          recipient_code: {
            $arrayElemAt: ["$uuu", 0],
          },
        },
      },
      {
        $addFields: {
          recipient_code: "$recipient_code.recipient_code",
        },
      },
      {
        $unset: "uuu",
      },
    ];
    const cursor = transactionsCol.aggregate(agg);

    /**
     * @type {[transactionTemplate]}
     */
    const result = await cursor.toArray();
    let toGoArray = result.map((obj) => ({
      reason: "Earnable payment",
      amount: obj.amountToWithdraw * 100,
      recipient: obj.recipient_code,
      transactionID: obj._id.toString(),
      accountID: obj.status.updatedBy,
    }));
    let promises = await Promise.allSettled([
      ...toGoArray.map(async (obj) => ({
        ...(await initiateTransfer(obj)),
        transactionID: obj.transactionID,
        accountID: obj.accountID,
      })),
    ]);
    for (const promise of promises) {
      if (promise.status === "rejected") {
        continue;
      }

      if (promise.value?.err) {
        let err = promise.value.err;
        if (err?.type === "failed_transfer") {
          let updates = {};
          let transactionUpdateRes = await updateTransactionByID({
            transactionID: promise.value.transactionID,
            update_processing_attempts: true,
          });
        }
        continue;
      }
      let transferCode = promise.value.transfer_code;
      let transactionUpdateRes = await updateTransactionByID({
        transactionID: promise.value.transactionID,
        updates: {
          transfer_code: transferCode,
          accountIDofUpdater: promise.value.accountID,
          status: "completed",
        },
      });
      if (transactionUpdateRes.err) {
        console.log(transactionUpdateRes);
        return;
      }
    }
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let attemptCancelLongTransactionsCronJob = async () => {
  try {
    const result =await transactionsCol.updateMany(
      {
        $and: [
          {
            $expr: {
              $or: [
                {
                  $and: [
                    {
                      $in: ["$status.name", ["initiated"]],
                    },
                    {
                      $gte:[
                        {
                         $dateDiff: {
                            startDate: "$status.updatedAt",
                            endDate: "$$NOW",
                            unit: "minute",
                         }
                        },10]
                    },
                  ],
                },
              ],
            },
          },
         { transfer_code:{$exists:false}}
        ],
      },
      [
        {
          $set: {
            status: {
              name: "failed",
              updatedBy: "$status.updateBy",
              updatedAt: new Date(),
            },
            tempStatus: "$status",
          },
        },
        {
          $set: {
            status_history: {
              $cond: {
                if: {
                  $and: [
                    "failed",
                    {
                      $ne: ["$tempStatus.name", "failed"],
                    },
                  ],
                },
                then: {
                  $cond: {
                    if: {
                      $and: ["$status_history"],
                    },
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
      ]
    ,{});
    //console.log(result);
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let attemptCancelLongWithdrawalCronJob = async () => {
  try {
    let getTransactionsByFiltersRes = await getTransactionsByFilters({
      status: "failed",
    });
    let { transactions: listOfFailedTransactions } = getTransactionsByFiltersRes;
    let promises = listOfFailedTransactions.map((obj) =>
      updateWithdrawalByTransactionID({
        transactionID: obj._id.toString(),
        updates: { status: "failed" },
      })
    );
    let settledPromises = await Promise.allSettled([...promises]);
    for await (const settledPromise of settledPromises) {
    }
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let createRecipientCodeCronJob = async () => {
  try {
    const agg = [
      {
        $match: {
          accountID: {
            $exists: true,
          },
          bank_code: {
            $exists: true,
          },
          acc_number: {
            $exists: true,
          },
          acc_name: {
            $exists: true,
          },
        },
      },
    ];
    const cursor = bank_detailsCol.aggregate(agg);

    /**
     * @type {[bankDetailsTemplate]}
     */
    const result = await cursor.toArray();
    let toGoArray = result;
    let settled = await Promise.allSettled([
      ...toGoArray.map(async (obj) => ({
        ...(await createRecipientCode(obj)),
        bankDetailID: obj._id.toString(),
      })),
    ]);
    let fulfilled = settled
      .filter((promResult) => promResult.status === "fulfilled")
      .map((obj) => obj.value);
    let newPoms = fulfilled
      .filter((obj) => obj?.recipient_code)
      .map((obj) => ({
        bankDetailID: obj.bankDetailID,
        recipient_code: obj.recipient_code,
      }))
      .map((obj) => updateRecieptCodeEmployeeID(obj));
    Promise.allSettled([...newPoms]);
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let transactionWork = async () => {
  try {
    let listOfProcessingTransactionsCursor = await transactionsCol.find({
      "status.name": "processing",
    });
    let listOfProcessingTransactions =
      await listOfProcessingTransactionsCursor.toArray();
    for await (const transaction of listOfProcessingTransactions) {
      let transactionID = transaction._id.toString();
      let accountIDofUpdater = transaction.status.updatedBy;
      let transfer_code = transaction.transferCode;
      if (!transfer_code) {
        continue;
      }
      let { data } = await verifyTransfer({ transfer_code });
      if (data) {
        if (data.status === "success") {
          let updateRes = await updateTransactionByID({
            transactionID,
            updates: {
              status: {
                name: "completed",
                updatedBy: accountIDofUpdater,
                updatedAt: new Date(),
              },
            },
          });
          if (updateRes.transaction) {
            let withdrawalUpdateRes = await updateWithdrawalByTransactionID({
              transactionID,
              status: "success",
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

let attemptUpdateWithdrawal = async () => {
  try {
    let getTransactionsByFiltersRes = await getTransactionsByFilters({
      status: "completed",
      transfer_code_exists: true,
    });
    let { transactions: listOfCompletedTransactions } =
      getTransactionsByFiltersRes;
    let promises = listOfCompletedTransactions.map((obj) =>
      updateWithdrawalByTransactionID({
        transactionID: obj._id.toString(),
        updates: { status: "completed" },
      })
    );
    let settledPromises = await Promise.allSettled([...promises]);
    for await (const settledPromise of settledPromises) {
    }
  } catch (error) {
    console.log(error);
  }
};

let job = new CronJob("0 * * * * *", async function (params) {
  attemptChangeEnrollmentStatusCronJob();
});

let job2 = new CronJob("0 * * * * *", async function (params) {
  createRecipientCodeCronJob();
});

let job3 = new CronJob("*/10 * * * * *", async function (params) {
  transactionWork();
});

let job4 = new CronJob("*/10 * * * * *", async function (params) {
  attemptReInitiateTransferCronJob();
});

let job5 = new CronJob("*/10 * * * * *", async function (params) {
  attemptUpdateWithdrawal();
});

let job6 = new CronJob("*/10 * * * * *", async function (params) {
  attemptCancelLongWithdrawalCronJob();
});
let job7 = new CronJob("*/10 * * * * *", async function (params) {
  attemptCancelLongTransactionsCronJob();
});
registerJob("attemptChangeEnrollmentStatusCronJob", job);
registerJob("createRecipientCodeCronJob", job2);
registerJob("transactionWork", job3);
registerJob("attemptReInitiateTransferCronJob", job4);
registerJob("attemptUpdateWithdrawal", job5);
registerJob("attemptCancelLongWithdrawalCronJob", job6);
registerJob("attemptCancelLongTransactionsCronJob", job7);
attemptCancelLongWithdrawalCronJob
attemptCancelLongTransactionsCronJob
module.exports = { attemptChangeEnrollmentStatus, getEmployeesSumOfWithdrawn };
