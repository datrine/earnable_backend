const { mongoClient } = require("../../utils/conn/mongoConn");
const { payrollTemplate } = require("../templates");
const { initiateTransfer } = require("../bank_detail");
const { createWalletTransaction } = require("../wallet");
const { updateEmployeePayrollTransactionID } = require("../payroll");
const waleprjDB = mongoClient.db("waleprj");
const payrollsCol = waleprjDB.collection("payrolls");

let autoPrepareSalaryTransactions = async () => {
  try {
    let preparePayrolls = await payrollsCol.updateMany(
      {
        auto_make_payroll_payment: true,
        totalSalaryPaymentStatus: { $ne: "fully_paid" },
        $expr: {
          $or: [
            {
              $and: [
                { $eq: ["$payment_mode", "wallet_full"] },
                {
                  $gte: ["$companyWalletBalance", "$employeesTotalNetSalaries"],
                },
              ],
            },
            { $eq: ["$payment_mode", "allow_partial_payment"] },
          ],
        },
        $expr: {
          $not: [
            {
              $in: [
                "$employeePayrollInfo.salary_payment_status.name",
                ["prepared", "initiated", "completed", "failed", "cancelled"],
              ],
            },
          ],
        },
      },
      {
        $set: {
          "employeePayrollInfo.$[].salary_payment_status": {
            name: "prepared",
            updatedAt: new Date(),
          },
        },
      }
    );
    console.log(preparePayrolls);
    let cursor = await payrollsCol.aggregate([
      {
        $match: {
          auto_make_payroll_payment: true,
        },
      },
      {
        $lookup: {
          from: "wallets",
          localField: "companyID",
          foreignField: "companyID",
          as: "wallet",
        },
      },
      {
        $set: {
          companyWalletBalance: { $first: "$wallet.balance" },
        },
      },
      {
        $match: {
          totalSalaryPaymentStatus: { $ne: "fully_paid" },
          $expr: {
            $or: [
              {
                $and: [
                  { $eq: ["$payment_mode", "wallet_full"] },
                  {
                    $gte: [
                      "$companyWalletBalance",
                      "$employeesTotalNetSalaries",
                    ],
                  },
                ],
              },
              { $eq: ["$payment_mode", "allow_partial_payment"] },
            ],
          },
        },
      },
      {
        $unwind: {
          path: "$employeePayrollInfo",
        },
      },
      {
        $match: {
          $expr: {
            $in: [
              "$employeePayrollInfo.salary_payment_status.name",
              ["prepared"],
            ],
          },
        },
      },
      {
        $match: {
              "employeePayrollInfo.payrollPaymentTransactionID":{$exists:false}
        },
      },
    ]);
    /**
     * @type {[payrollTemplate]}
     */
    let unpaidPayrolls = await cursor.toArray();
    console.log({ unpaidPayrolls });
    let flattened = unpaidPayrolls.map(({ employeePayrollInfo, ...rest }) => ({
      ...rest,
      ...employeePayrollInfo,
    }));
    let filteredEmployeeInfoWithRecipientAccounts = flattened.filter(
      ({ employeeAccRecipientCode }) => employeeAccRecipientCode
    );
    let arrayOf = [];
    for (const filtered of filteredEmployeeInfoWithRecipientAccounts) {
      let {
        employeeID,
        employeeAccountID,
        employeeNetSalary,
        employeeAccRecipientCode,
        companyID,
        salaryMonthID,
        salaryYearID,
      } = filtered;
      let transactionFn = createWalletTransaction({
        employeeID: employeeID,
        amountToPay: employeeNetSalary,
        companyID,
        salaryMonthID,
        salaryYearID,
        accountID: employeeAccountID,
        recipient_code: employeeAccRecipientCode,
      });
      arrayOf.push(transactionFn);
    }
    let promiseResults = await Promise.allSettled([...arrayOf]);
    let arrayOf2 = [];
    for (const result of promiseResults) {
      console.log(result);
      if (result.status === "rejected") {
        continue;
      }
      if (result?.value?.err) {
        continue;
      }
      let {
        transactionID,
        companyID,
        employeeID,
        salaryMonthID,
        salaryYearID,
      } = result.value;
      let prom = updateEmployeePayrollTransactionID({
        companyID,
        salaryMonthID,
        salaryYearID,
        employeeID,
        payrollPaymentTransactionID: transactionID,
      });
      arrayOf2.push(prom);
    }
    let promiseResults2 = await Promise.allSettled([...arrayOf2]);

    return { info: "Payroll made..." };
  } catch (error) {
    console.log(error);
    throw { err: error };
  }
};

module.exports = { autoPrepareSalaryTransactions };

/**/
let autoInitiateWalletTrasanctionTransfer = async () => {
  try {
    initiateTransfer({ source, reason, amount, recipient });
  } catch (error) {
    console.log(error);
  }
};

let arr = [
  {
    $match: {
      auto_make_payroll_payment: true,
      totalSalaryPaymentStatus: { $ne: "fully_paid" },
      $expr: {
        $or: [
          {
            $and: [
              { $eq: ["$payment_mode", "wallet_full"] },
              {
                $gte: ["$companyWalletBalance", "$employeesTotalNetSalaries"],
              },
            ],
          },
          { $eq: ["$payment_mode", "allow_partial_payment"] },
        ],
      },
    },
  },
  {
    $lookup: {
      from: "wallets",
      localField: "companyID",
      foreignField: "companyID",
      as: "wallet",
    },
  },
  {
    $set: {
      companyWalletBalance: { $first: "$wallet" },
    },
  },
  {
    $unwind: {
      path: "$employeePayrollInfo",
    },
  },
  {
    $match: {
      $expr: {
        $not: [
          {
            $in: [
              "$employeePayrollInfo.salary_payment_status.name",
              ["completed", "failed", "cancelled"],
            ],
          },
        ],
      },
    },
  },
];
