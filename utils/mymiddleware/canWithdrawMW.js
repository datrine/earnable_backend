const { getBankDetailsByAccountID } = require("../../db/bank_detail");
const { getEmployeeByAccountID } = require("../../db/employee");
const { findAndVerifyToken } = require("../../db/token");
/**
 * @type {import("ng-banks").default}
 */
const ngBank = require("ng-banks");
const { getCompanyByID } = require("../../db/company");
const { getDepartmentByDepartmentID } = require("../../db/department");
const { bankDetailsTemplate, accTemplate } = require("../../db/templates");
const { retrieveAccountInfoByAccountID } = require("../../db/account");

/**
 *
 * @param {import("express").request} req
 * @param {import("express").Response} res
 * @param {function} next
 */
let canWithdrawVerMW = async (req, res, next) => {
  try {
    let { amount } = req.session.queried;
    if (!amount) {
      return res.json({ err: { msg: "Amount to withdraw must be included." } });
    }
    amount = Number(amount) && Number(amount);
    if (Number.isNaN(amount)) {
      return res.json({
        err: {
          msg: "Amount to withdraw must be a valid amount in naira.kobo.",
        },
      });
    }
    req.session.queried.amount = amount;

    /**
     * @type {{account:accTemplate}}
     */
    let { account: queriedAccount, accountID: queriedAccountID } =
      req.session.queried;
    if (!queriedAccount && !queriedAccountID) {
      return res.json({ err: { msg: "No accountID supplied." } });
    }
    if (!queriedAccount) {
      let retrieveRes = await retrieveAccountInfoByAccountID(queriedAccountID);
      if (retrieveRes.err) {
        return res.json(retrieveRes);
      }
      queriedAccount = retrieveRes.account;
      queriedAccountID = queriedAccount.accountID;
    }
    if (!queriedAccount?.activity?.current?.name === "active") {
      return res.json({ err: { msg: "Account yet active." } });
    }
    let getEmployeeRes = await getEmployeeByAccountID({
      accountID: queriedAccountID,
    });
    if (getEmployeeRes.err) {
      return res.json(getEmployeeRes);
    }
    let employee = getEmployeeRes.employee;

    /**
     * @type {bankDetailsTemplate}
     */
    let bank_details;
    /**
     * @type {}
     */
    let department;
    let company;

    let promises = Promise.allSettled([
      getCompanyByID({ id: employee.companyID }),
      getBankDetailsByAccountID({ accountID: queriedAccountID }),
      getDepartmentByDepartmentID({ departmentID: employee.deptID }),
    ]);
    let [companyResult, bankDetailsResult, departmentResult] = await promises;
    for await (const promise of [
      companyResult,
      bankDetailsResult,
      departmentResult,
    ]) {
      if (promise.status === "rejected") {
        return res.json({ err: { msg: "" } });
      }
      if (promise.err) {
        return res.json(promise.err);
      }
      if (promise.value.company) {
        company = promise.value.company;
      }
      if (promise.value.bankDetails) {
        bank_details = promise.value.bankDetails;
      }
      if (promise.value.department) {
        department = promise.value.department;
      }
    }

    if (!bank_details?.recipient_code) {
      return res.json({ err: { msg: "Account not yet linked up" } });
    }
    let queried = {};
    queried.account = queriedAccount;
    queried.employee_details = employee;
    queried.company = company;
    queried.department = department;
    queried.bank_details = {
      bank_code: bank_details.bank_code,
      bank_name: bank_details.bank_name,
      acc_number: bank_details.acc_number,
      acc_name: bank_details.acc_name,
      recipient_code: bank_details.recipient_code,
      bankDetailID: bank_details._id.toString(),
    };
    req.session.queried = { ...req.session.queried, ...queried };
    next();
  } catch (error) {
    console.log(error);
    return res.json({ err: error });
  }
};

module.exports = { canWithdrawVerMW };
