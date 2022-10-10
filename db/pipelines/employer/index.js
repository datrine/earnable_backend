const composeGetDeptInfoTableAgg = require("./get_depts_table_info");
const composeGetEmployeesDetailsAgg = require("./get_employees_details");
const composeGetEmployeeInfoTableAgg = require("./get_employees_table_info");
const composeGetEmployeesFlexibleAccessInfoTableAgg = require("./get_employees_table__flexible_access_info");

module.exports = {
  composeGetEmployeeInfoTableAgg,
  composeGetDeptInfoTableAgg,
  composeGetEmployeesFlexibleAccessInfoTableAgg,
  composeGetEmployeesDetailsAgg,
};
