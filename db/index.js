const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const { ObjectId, UUID } = require("bson");
const { employeeTemplate } = require("./templates");
const { updateEmployeeInfo, getEmployeeByEmployeeID } = require("./employee");
const { retrieveAccountInfoByAccountID } = require("./account");
const { getBankDetailsByAccountID } = require("./bank_detail");
const { CronJob } = require("cron");

let attemptChangeEnrollmentStatus = async ({
  accountID,
  employeeID,
  enrollment_status,
}) => {
  try {
    console.log("Starting something...");
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
      console.log("Real error");
      return { err: { msg: "Error: Failed to verify critical information" } };
    }
    let accountErr = accountResult.value.err;
    let account = accountResult.value.account;
    if (accountErr) {
      console.log(accountErr);
      return accountErr;
    }

    let bankDetailsErr = bankDetailsResult.value.err;
    let bankDetails = bankDetailsResult.value.bankDetails;
    if (bankDetailsErr) {
      console.log(bankDetailsErr);
      return bankDetailsErr;
    }

    let employeeErr = employeeResult.value.err;
    let employee = employeeResult.value.employee;
    if (employeeErr) {
      console.log(employeeErr);
      return employeeErr;
    }

    console.log(enrollment_status);
    if (enrollment_status === "enrolled") {
      console.log("Starting something.........");
      if (
        account.acc_type !== "employee" ||
        account.activity.current.name !== "active" ||
        !bankDetails.acc_number ||
        bankDetails.recipient_code
      ) {
        enrollment_status = "pending";
        console.log("changing to pending...");
        let response = await updateEmployeeInfo({
          employeeID,
          enrollment_status,
        });
        return { ...response, enrollment_status };
      } else if (employee.enrollment_state.state === "pending") {
        console.log("Already pending...");
        return;
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
      console.log(response);
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
    let toGoArray = result.map((obj) => ({
      accountID: obj.accountID,
      employeeID: obj.employeeID,
      enrollment_status: obj.enrollment_state.state,
    }));
    await Promise.allSettled([
      ...toGoArray.map((obj) => attemptChangeEnrollmentStatus(obj)),
    ]);
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};
let job = new CronJob("0 * * * * *", async function (params) {
  attemptChangeEnrollmentStatusCronJob();
});
job.start();
//registerJob("attemptChangeEnrollmentStatusCronJob", job);

module.exports={attemptChangeEnrollmentStatus}
