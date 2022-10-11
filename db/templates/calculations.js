const { ObjectId } = require("mongodb");

let calculationItemTemplate = {
  _id: new ObjectId("633235f93ad738e40fe5b59f"),
  companyIssuedEmployeeID: "Y000012",
  accountID: "XBI2CveEchMIZfmSVYkgA",
  companyID: "630f2a2387b40d7834830e0e",
  job_title: [""],
  monthly_salary: 60000,
  deptID: "631e0b43df217865eba479c4",
  department: "Security",
  enrollment_state: { state: "", createdOn: "" },
  lastModified: "2022-09-29T21:21:04.119Z",
  createdOn: "2022-09-26T23:30:01.413Z",
  acc_number: "0781077095",
  acc_name: "Alabi Olutomi",
  bank_name: "ACCESS BANK",
  bank_code: "044",
  full_name: "Olutomi Alabi",
  f_name: "Olutomi",
  l_name: "Alabi",
  email: "topeomoalabi@gmail.com",
  phonenum: "+2348052573344",
  enrollment_status: "enrolled",
  resolvedFlexibleAccess: {
    /**
     * @type {50|75}
     */
    access_value: 75,
    /**
     * @type {"employee"|"employer"|"shared"}
     */
    access_mode: "",
  },
  /**
   * @type {50|75}
   */
  resolvedFlexibleAccessValue: 75,
  /**
   * @type {"employee"|"employer"|"shared"}
   */
  resolvedflexibleAccessMode: "shared",
  filteredWithdrawalCount: 4,
  sumWithdrawal: 32220,
  employeeTotalFlexibleAccess: 45000,
  sumWithdrawalFeesByEmployee: 75,
  sumWithdrawalFees: 75,
  sumWithdrawalFeesByEmployer: 409.425,
  date: "2022-10-10T14:08:20.097Z",
  time: "2022-10-10T14:08:20.097Z",
  employeeReconciledDebt:0,
  employeeAvailableFlexibleAccess: 12780,
  employeeTotalNetPay: 27780,
};
let accumulationsTemplate = {
  _id: null,
  accumulatedTotalWithdrawals: 22295,
  accumulatedAvailableFlexibleAccess: 45000,
  accumulatedTotalFlexibleAccess: 22705,
  accumulatedTotalSalaries: 60000,
  accumulatedTotalNetPay: 37705,
  accumulatedWithdrawalFeesByEmployee: 0,
  accumulatedWithdrawalFeesByEmployer: 334.425,
  accumulatedReconciledDebts:0,
  totalWithdrawingEmployees: 1,
  totalFilteredWithdrawals: 3,
};
module.exports = { calculationItemTemplate,accumulationsTemplate };
