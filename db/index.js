const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const transactionsCol = waleprjDB.collection("transactions");
const companiesCol = waleprjDB.collection("companies");
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
const { autoVerifyRefunds } = require("./jobs/auto_verify_refunds");
const { autoPreparePayrolls } = require("./jobs/auto_prepare_payroll");
const {
  autoPaySalaries,
  autoPrepareSalaryTransactions,
} = require("./jobs/auto_pay_salaries");

let setSalaryDatesOfCompany = async () => {
  try {
    let companyDoc = await companiesCol.updateMany(
      {
        $expr: {
          $and: {
            $gte: [
              "$$NOW",
              {
                $ifNull: [
                  "$next_salary_date",
                  /* */ {
                    $dateFromParts: {
                      year: { $year: "$$NOW" },
                      month: { $month: "$$NOW" },
                      day: { $toInt: "$salary_date" },
                      hour: 24,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      [
        {
          $set: {
            prev_salary_date: "$next_salary_date",
            next_salary_date: {
              $cond: {
                if: {
                  $lt: [
                    "$$NOW",
                    {
                      $dateFromParts: {
                        year: { $year: "$next_salary_date" },
                        month: { $month: "$next_salary_date" },
                        day: { $toInt: "$salary_date" },
                      },
                    },
                  ],
                },
                then: {
                  $dateFromParts: {
                    year: { $year: "$next_salary_date" },
                    month: { $month: "$next_salary_date" },
                    day: { $toInt: "$salary_date" },
                  },
                },
                else: {
                  $let: {
                    vars: {
                      incDate: {
                        $dateAdd: {
                          startDate: "$next_salary_date",
                          unit: "month",
                          amount: 1,
                        },
                      },
                    },
                    in: {
                      $dateFromParts: {
                        year: { $year: "$$incDate" },
                        month: { $month: "$$incDate" },
                        day: { $toInt: "$salary_date" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $set: {
            salaryMonthID: { $month: "$next_salary_date" },
            salaryYearID: { $year: "$next_salary_date" },
            lastModified: new Date(),
          },
        },
      ]
    );
  } catch (error) {
    console.log(error);
  }
};

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

let attemptReInitiateWithdrawalTransferCronJob = async () => {
  try {
    const agg = [
      {
        $match: {
          "status.name": "processing",
          "status.transfer_code": { $exists: false },
          $and: [
            {
              $expr: {
                $eq: ["$type", "withdrawal"],
              },
            },
          ],
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
          let transactionUpdateRes = await updateTransactionByID({
            transactionID: promise.value.transactionID,
            updates: {
              status: "failed",
              accountIDofUpdater: promise.value.accountID,
            },
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

let attemptAutoFailLongTransactionsCronJob = async () => {
  try {
    const result = await transactionsCol.updateMany(
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
                      $gte: [
                        {
                          $dateDiff: {
                            startDate: "$status.updatedAt",
                            endDate: "$$NOW",
                            unit: "minute",
                          },
                        },
                        10,
                      ],
                    },
                  ],
                },
              ],
            },
          },
          /* {
            $expr: {
              $eq: [
                "$type",
                {
                  $ifNull: [type, "$type"],
                },
              ],
            },
          },*/
          { transfer_code: { $exists: false } },
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
      ],
      {}
    );
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let attemptAutoFailLongWithdrawalCronJob = async () => {
  try {
    let getWithdrawalTransactionsByFiltersRes = await getTransactionsByFilters({
      status: "failed",
      type: "withdrawal",
    });
    let { transactions: listOfFailedTransactions } =
      getWithdrawalTransactionsByFiltersRes;
     // console.log({count_of_failed:listOfFailedTransactions.length})
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

let attemptUpdateCancelledWithdrawalCronJob = async () => {
  try {
    let getTransactionsByFiltersRes = await getTransactionsByFilters({
      status: "cancelled",
      type: "withdrawal",
    });
    let { transactions: listOfCancelledTransactions } =
      getTransactionsByFiltersRes;
    let promises = listOfCancelledTransactions.map((obj) =>
      updateWithdrawalByTransactionID({
        transactionID: obj._id.toString(),
        updates: { status: "cancelled" },
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

let withdrawalTransactionWork = async () => {
  try {
    let listOfProcessingTransactionsCursor = await transactionsCol.find({
      "status.name": "processing",
      type: "withdrawal",
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
              updates: { status: "completed" },
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
      type:"withdrawal",
      //transfer_code_exists: true,
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

let attemptProcessPayrollTransactionsCronJob = async () => {
  try {
    const agg = [
      {
        $match: {
          "status.name": "initiated",
          "status.transfer_code": { $exists: false },
          $and: [
            {
              $expr: {
                $eq: ["$type", "payroll_payment"],
              },
            },
          ],
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
            updates: {
              status: "failed",
              accountIDofUpdater: promise.value.accountID,
            },
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

let job = new CronJob("0 * * * * *", async function (params) {
  attemptChangeEnrollmentStatusCronJob();
});

let job2 = new CronJob("0 * * * * *", async function (params) {
  createRecipientCodeCronJob();
});

let job3 = new CronJob("*/10 * * * * *", async function (params) {
  withdrawalTransactionWork();
});

let job4 = new CronJob("*/10 * * * * *", async function (params) {
  attemptReInitiateWithdrawalTransferCronJob();
});

let job5 = new CronJob("*/10 * * * * *", async function (params) {
  attemptUpdateWithdrawal();
});

let job6 = new CronJob("*/10 * * * * *", async function (params) {
  attemptAutoFailLongWithdrawalCronJob();
});
let job7 = new CronJob("*/10 * * * * *", async function (params) {
  attemptAutoFailLongTransactionsCronJob();
});
let job8 = new CronJob("*/10 * * * * *", async function (params) {
  attemptUpdateCancelledWithdrawalCronJob();
});
let job9 = new CronJob("*/10 * * * * *", async function (params) {
  autoVerifyRefunds();
});
let job10 = new CronJob("*/10 * * * * *", async function (params) {
  try {
    /*let results = await autoPreparePayrolls();
    if (results) {
    }*/
    await setSalaryDatesOfCompany();
  } catch (error) {
    console.log(error);
  }
});

let job11 = new CronJob("*/10 * * * * *", async function (params) {
  try {
    //await autoPrepareSalaryTransactions()
  } catch (error) {
    console.log(error);
  }
});

//
registerJob("attemptChangeEnrollmentStatusCronJob", job);
registerJob("createRecipientCodeCronJob", job2);
registerJob("transactionWork", job3);
registerJob("attemptReInitiateWithdrawalTransferCronJob", job4);
registerJob("attemptUpdateWithdrawal", job5);
registerJob("attemptCancelLongWithdrawalCronJob", job6);
registerJob("attemptCancelLongTransactionsCronJob", job7);
registerJob("attemptUpdateCancelledWithdrawalCronJob", job8);
registerJob("autoVerifyRefunds", job9);
registerJob("setSalaryDatesOfCompany", job10);
registerJob("autoPaySalaries", job11);

module.exports = { attemptChangeEnrollmentStatus, getEmployeesSumOfWithdrawn };
