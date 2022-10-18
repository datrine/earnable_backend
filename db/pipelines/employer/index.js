const composeGetAccumulationsAgg = require("./get_accumulations");
const composeGetCalculatedListAgg = require("./get_calculated_list");
const composeGetDebtListAgg = require("./get_debt_list");
const composeGetDeptInfoTableAgg = require("./get_depts_table_info");
const composeGetEmployeesDetailsAgg = require("./get_employees_details");
const composeGetEmployeesReconciliationTableAgg = require("./get_employees_reconciliation_table");
const composeGetEmployeeInfoTableAgg = require("./get_employees_table_info");
const composeGetEmployeesFlexibleAccessInfoTableAgg = require("./get_employees_table__flexible_access_info");
const persistPayrollAgg = require("./persist_payroll_agg");
const {
  prepareAllPayrollAgg,
  prepareCompanyPayrollAgg,
  preparePayrollAgg,
} = require("./prepare_payroll_agg");

module.exports = {
  composeGetEmployeeInfoTableAgg,
  composeGetDeptInfoTableAgg,
  composeGetEmployeesFlexibleAccessInfoTableAgg,
  composeGetEmployeesDetailsAgg,
  composeGetEmployeesReconciliationTableAgg,
  composeGetCalculatedListAgg,
  composeGetAccumulationsAgg,
  composeGetDebtListAgg,
  prepareAllPayrollAgg,
  prepareCompanyPayrollAgg,
  preparePayrollAgg,persistPayrollAgg
};
