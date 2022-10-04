const router = require("express").Router();
const { getWalletByCompanyID } = require("../../../db/wallet");
const { getEmployeeWithdrawalHistory } = require("../../../db/withdrawal");
const { getEmployeeByAccountID } = require("../../../db/employee");
const {
  setAccountSessionIfExist,
  getQueriedEmployeeWithdrawalBankDetailsMW,
} = require("../../../utils/mymiddleware/accounts");

router.get("/", async (req, res, next) => {
  try {
    let {
      employeeID: queriedEmployeeID,
      accountID: queriedAccountID,
      ...filters
    } = req.query;
    if (!queriedEmployeeID && !queriedAccountID) {
      return res.json({ err: { msg: "Employee ID cannot be empty" } });
    }
    if (!queriedEmployeeID) {
      let getEmployeeByAccountIDRes = await getEmployeeByAccountID({
        accountID: queriedAccountID,
      });
      if (getEmployeeByAccountIDRes.err) {
        return res.json({ err: getEmployeeByAccountIDRes });
      }
      queriedEmployeeID = getEmployeeByAccountIDRes.employee.employeeID;
    }
    let withdrawalHistoryRes = await getEmployeeWithdrawalHistory({
      employeeID: queriedEmployeeID,
      filters,
    });
    res.json(withdrawalHistoryRes);
  } catch (error) {
    console.log(error);
    res.json({ err: error });
  }
});

router.get(
  "/withdrawal_charge_mode",
  (req, res, next) => {
    console.log(req.query);
    next();
  },
  setAccountSessionIfExist,
  getQueriedEmployeeWithdrawalBankDetailsMW,
  async (req, res, next) => {
    try {
      let { company, department } = req.session.queried;
      let withdrawal_charge_mode =
        (Array.isArray(department?.policies) &&
          Array.from(department?.policies)
            .reverse()
            .find((policy) => policy.name === "withdrawal_charge_mode")) ||
        company?.withdrawal_charge_mode ||
        "employer";
      res.json({ withdrawal_charge_mode });
    } catch (error) {
      console.log(error);
    }
  }
);

router.get("/:withdrawalID", async (req, res, next) => {
  try {
    let { companyID, walletID } = req.params;
    if (companyID) {
      let walletRes = await getWalletByCompanyID();
      console.log(walletRes);
      return res.json(walletRes);
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
