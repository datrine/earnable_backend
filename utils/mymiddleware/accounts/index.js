const { getBankDetailsByAccountID } = require("../../../db/bank_detail");
const { getCompanyByID } = require("../../../db/company");
const { getDepartmentByDepartmentID } = require("../../../db/department");
const { getEmployeeByAccountID } = require("../../../db/employee");

/**
 *
 * @param {import("express").request} req
 * @param {import("express").Response} res
 * @param {function} next
 */
let setAccountSessionIfExist = async (req, res, next) => {
  try {
    let sessID = req.headers.authorization?.split(" ")[1];
    if (!sessID) {
      return next();
    }
    req.session.sessID = sessID;
    let accountRes = await retrieveAccountInfoBySessID(sessID);
    if (accountRes.err) {
      return res.json(accountRes);
    }
    req.session.account = accountRes.account;
    /**
     * @type {accTemplate}
     */
    let account = session.account;
    if (account?.loginInfo?.current_session) {
      let cur_sess = account.loginInfo.current_session;
      if (sessID !== cur_sess.sessID) {
        console.log("sessID not valid");
        return res.json({ err: { msg: "AccessID not valid" } });
      }
      if (new Date() > cur_sess.expires_on) {
        console.log("current account session has expired");
        return res.json({
          err: { msg: "current account session has expired" },
        });
      }
    }
    let {
      state,
      account: accFromServer,
      err,
    } = await accountAccIDResetSet({ sessID });
    if (err) {
      res.status = 400;
      return res.json({ err });
    }
    if (!accFromServer) {
      return res.json({ state });
    }
    let self = {};
    self.account = accFromServer;
    self.accountID = accFromServer.accountID;
    self.state = state;
    self.sessID = accFromServer.loginInfo.current_session.sessID;
    req.session.self = { ...req.session.self, self };

    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 *
 * @param {import("express").request} req
 * @param {import("express").Response} res
 * @param {function} next
 */
let getQueriedEmployeeWithdrawalBankDetailsMW = async (req, res, next) => {
  try {
    let { accountID: queriedAccountID } = req.query;
    if (!queriedAccountID) {
      return res.json({ err: { msg: "No account ID supplied" } });
    }
    let getEmployeeRes = await getEmployeeByAccountID({
      accountID: queriedAccountID,
    });
    if (getEmployeeRes.err) {
      res.json(getEmployeeRes);
    }
    let employee = getEmployeeRes.employee;
    let department, company, bank_details;

    let promises = await Promise.allSettled([
      getCompanyByID({ id: employee.companyID }),
      getBankDetailsByAccountID({ accountID: queriedAccountID }),
      getDepartmentByDepartmentID({ departmentID: employee.deptID }),
    ]);
    let [
      queriedCompanyResult,
      queriedBankDetailsResult,
      queriedDepartmentResult,
    ] = promises;
    for (const promise of [
      queriedCompanyResult,
      queriedBankDetailsResult,
      queriedDepartmentResult,
    ]) {
      if (promise.status === "rejected") {
        return res.json({ err: { msg: "" } });
      }
      if (promise.err) {
        console.log(promise.err);
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

    if (!bank_details.recipient_code) {
      res.json({ err: { msg: "Account not yet linked up" } });
    }
    let queried = {};
    queried.employee_details = employee;
    queried.company = company;
    queried.department = department;
    queried.bank_details = {
      acc_number: bank_details.acc_number,
      acc_name: bank_details.acc_name,
      recipient_code: bank_details.recipient_code,
      bankDetailID: bank_details._id.toString(),
    };
    req.session.queried ={...req.session.queried, ...queried};
    next();
  } catch (error) {
    console.log(error);
    return res.json({ err: error });
  }
};

module.exports = {
  setAccountSessionIfExist,
  getQueriedEmployeeWithdrawalBankDetailsMW,
};
