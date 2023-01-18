const router = require("express").Router();
//const { getEmployeesSumOfWithdrawn } = require("../../db");
const {
  getTotalFlexibleAccess,
  getTotalNetPay,
  getEmployeeNetEarning,
  getAvailableFlexibleAccess,
  getEmployeesSumOfWithdrawn,
  getReconciliationReport,
  getDebtList,
  getTotalWithdrawalCount,
  getPaymentListForCompany,
} = require("../../db/calculations");
const { getTotalSalaries, getAmountToRefund } = require("../../db/employee");
const { getCalculatedRefund } = require("../../db/refund");

router.get("/reconciliated_salary_list", async (req, res, next) => {
  try {
    let { filters } = req.session.queried;
    let getEmployeesSumOfWithdrawnRes = await getEmployeesSumOfWithdrawn({
      filters,
    });
    res.json(getEmployeesSumOfWithdrawnRes);
  } catch (error) {
    console.log(error);
  }
});

router.get("/total_withdrawal", async (req, res, next) => {
  try {
    let { filters } = req.session.queried;
    let getEmployeesSumOfWithdrawnRes = await getEmployeesSumOfWithdrawn({
      filters,
    });
    res.json(getEmployeesSumOfWithdrawnRes);
  } catch (error) {
    console.log(error);
  }
});

router.get("/total_flexible_access", async (req, res, next) => {
  try {
    let { filters } = req.session.queried;
    let totalFlexibleAccess = await getTotalFlexibleAccess({ filters });
    res.json(totalFlexibleAccess);
  } catch (error) {
    console.log(error);
  }
});

router.get("/available_flexible_access", async (req, res, next) => {
  try {
    let { filters } = req.session.queried;
    let availableFlexibleAccessRes = await getAvailableFlexibleAccess({
      filters,
    });
    res.json({ ...availableFlexibleAccessRes, filters });
  } catch (error) {
    console.log(error);
  }
});

router.get("/debt_list", async (req, res, next) => {
  try {
    let { filters } = req.session.queried;
    let getDebtListRes = await getDebtList({
      filters,
    });
    res.json({ ...getDebtListRes, filters });
  } catch (error) {
    console.log(error);
  }
});

router.get("/total_withdrawal_count", async (req, res, next) => {
  try {
    let { filters } = req.session.queried;
    let total_withdrawal = await getTotalWithdrawalCount({ filters });
    res.json(total_withdrawal);
  } catch (error) {
    console.log(error);
  }
});

router.get("/total_net_pay", async (req, res, next) => {
  try {
    let { filters } = req.session.queried;
    let total_withdrawal = await getTotalNetPay({ filters });
    res.json(total_withdrawal);
  } catch (error) {
    console.log(error);
  }
});

router.get("/count", async (req, res, next) => {
  try {
    let { withdrawal_history } = req.session;
    res.json({ withdrawal_count: withdrawal_history.length });
  } catch (error) {
    console.log(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    let { withdrawal_history } = req.session.queried;
    res.json({ withdrawal_history });
  } catch (error) {
    console.log(error);
  }
});

router.get("/total_salaries", async (req, res, next) => {
  let { filters, companyID } = req.session.queried;
  filters.companyID = companyID;
  filters = req.query;
  let totalSalaries = await getTotalSalaries({ companyID, filters });
  return res.json(totalSalaries);
});

router.get("/employee_net_earnings", async (req, res, next) => {
  let { employeeID } = req.session.queried;

  if (!employeeID) {
    return res.json({ err: { msg: "Employee ID not supplied..." } });
  }
  let filters = req.query;
  let totalSalaries = await getEmployeeNetEarning({
    filters: { ...filters, employeeID },
  });
  return res.json(totalSalaries);
});

router.get("/employees_flexible_access_list", async (req, res, next) => {
  let { employeeID } = req.session.queried;

  if (!employeeID) {
    return res.json({ err: { msg: "Employee ID not supplied..." } });
  }
  let filters = req.query;
  let totalSalaries = await getEmployeeNetEarning({
    filters: { ...filters, employeeID },
  });
  return res.json(totalSalaries);
});

router.get("/reconciliation_report", async (req, res, next) => {
  try {
    let { filters } = req.session.queried;
    let getReconciliationReportRes = await getReconciliationReport({ filters });
    res.json(getReconciliationReportRes);
  } catch (error) {
    console.log(error);
  }
});

router.get("/amount_to_refund", async (req, res, next) => {
  let { filters, companyID } = req.session.queried;
  filters.companyID = companyID;
  filters ={...req.query,...filters} ;
  let getAmountToRefundRes = await getCalculatedRefund(filters);
  return res.json(getAmountToRefundRes);
});

router.get("/company_payment_list", async (req, res, next) => {
  let { filters, companyID } = req.session.queried;
  filters.companyID = companyID;
  filters ={...req.query,...filters} ;
  let getAmountToRefundRes = await getPaymentListForCompany({ filters });
  return res.json(getAmountToRefundRes);
});


//
module.exports = router;
