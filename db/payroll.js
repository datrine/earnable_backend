const { mongoClient } = require("../utils/conn/mongoConn");
const DB_NAME=process.env.DB_NAME
const waleprjDB = mongoClient.db(DB_NAME);
const payrollsCol = waleprjDB.collection("payrolls");
const { ObjectId, UUID } = require("bson");

let createMonthlyPayroll = async ({
  companyID,
  salaryMonthID,
  salaryYearID,
  salary_list,
}) => {
  try {
    let result1 = await payrollsCol.insertOne({
      lastModified: new Date(),
      createdOn: new Date(),
    });
    if (!result1.insertedId) {
      return { err: { msg: "Unable to Add employee..." } };
    }
    return { employeeID: result1.insertedId.toString() };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let updateEmployeePayrollTransactionID = async ({
  companyID,
  salaryMonthID,
  salaryYearID,
  employeeID,
  payrollPaymentTransactionID,
}) => {
  try {
    let result1 = await payrollsCol.updateOne(
      {
        companyID,
        salaryMonthID,
        salaryYearID,
        "employeePayrollInfo.$.employeeID": employeeID,
      },
      {
        $set: {
          "employeePayrollInfo.$.payrollPaymentTransactionID":
            payrollPaymentTransactionID,
          lastModified: new Date(),
        },
      }
    );
    if (!result1.acknowledged) {
      return {
        err: { msg: "Unable to update employee's payroll transaction ID..." },
      };
    }
    return { info: "Transaction ID updated for payroll" };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let updateEmployeePayrollTransactionStatus = async ({
  companyID,
  salaryMonthID,
  salaryYearID,
  employeeID,
  payrollPaymentTransactionID,
  payrollPaymentTransactionStatus,
}) => {
  try {
    let result1 = await payrollsCol.updateOne(
      {
        companyID,
        salaryMonthID,
        salaryYearID,
        employeePayrollInfo: {
          $elemMatch: { employeeID, payrollPaymentTransactionID },
        },
      },
      {
        $set: {
          "employeePayrollInfo.$.salary_payment_status": {
            name: payrollPaymentTransactionStatus,
            updatedAt: new Date(),
          },
          lastModified: new Date(),
        },
      }
    );
    if (!result1.acknowledged) {
      return {
        err: { msg: "Unable to update employee's payroll transaction ID..." },
      };
    }
    return { info: "Transaction ID updated for payroll" };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};
module.exports = {
  updateEmployeePayrollTransactionID,
  updateEmployeePayrollTransactionStatus,
};
