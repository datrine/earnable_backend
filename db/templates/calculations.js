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
  employeeReconciledDebt: 0,
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
  accumulatedReconciledDebts: 0,
  totalWithdrawingEmployees: 1,
  totalFilteredWithdrawals: 3,
};

let debtListTemplate = {
  "_id": {
    "companyID": "630f2a2387b40d7834830e0e",
    "fromDate": "2022-09-26T00:00:00.000Z",
    "toDate": "2022-10-26T00:00:00.000Z"
  },
  "accumulatedRefundedAmount": 25000,
  "companyID": "630f2a2387b40d7834830e0e",
  "monthNumber": 10,
  "yearId": 2022,
  "fromDate": "2022-09-26T00:00:00.000Z",
  "toDate": "2022-10-26T00:00:00.000Z",
  "withdrawals": [
    {
      "_id": "6337b2f7fe3a59e329f99c11",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "6337b2f7fe3a59e329f99c10",
      "status": {
        "name": "failed",
        "updatedAt": "2022-10-08T14:15:40.212Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 5000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 0,
        "withdrawal_fee": 75,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 0,
        "amountDeductible": 5000,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 40000,
        "grossAmountToWithdraw": 5000,
        "netAmountToWithdraw": 0
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.103Z",
      "createdOn": "2022-10-01T03:24:39.457Z",
      "tempStatus": {
        "name": "failed",
        "updatedAt": "2022-10-08T14:15:40.212Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-05T11:48:47.183Z"
        }
      ]
    },
    {
      "_id": "633ab9608863d32e4d7ea437",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "633ab9608863d32e4d7ea436",
      "status": {
        "name": "failed",
        "updatedAt": "2022-10-08T14:15:40.213Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 5000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 0,
        "withdrawal_fee": 75,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 75,
        "amountDeductible": 0,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 45000,
        "grossAmountToWithdraw": 5000,
        "netAmountToWithdraw": 5000
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.103Z",
      "createdOn": "2022-10-03T10:28:48.352Z",
      "tempStatus": {
        "name": "failed",
        "updatedAt": "2022-10-08T14:15:40.213Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-05T11:48:47.183Z"
        }
      ]
    },
    {
      "_id": "633ad79eff900218ab5f4c4d",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "633ad79eff900218ab5f4c4c",
      "status": {
        "name": "failed",
        "updatedAt": "2022-10-08T14:15:40.213Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 8500,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 5150,
        "withdrawal_fee": 127.5,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 127.5,
        "amountDeductible": 0,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 39850,
        "grossAmountToWithdraw": 8500,
        "netAmountToWithdraw": 8500
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.103Z",
      "createdOn": "2022-10-03T12:37:50.674Z",
      "tempStatus": {
        "name": "failed",
        "updatedAt": "2022-10-08T14:15:40.213Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-05T11:48:47.183Z"
        }
      ]
    },
    {
      "_id": "633ad81eff900218ab5f4c50",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "633ad81eff900218ab5f4c4f",
      "status": {
        "name": "failed",
        "updatedAt": "2022-10-08T14:15:40.213Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 28500,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 13777.5,
        "withdrawal_fee": 427.5,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 427.5,
        "amountDeductible": 0,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 31222.5,
        "grossAmountToWithdraw": 28500,
        "netAmountToWithdraw": 28500
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.103Z",
      "createdOn": "2022-10-03T12:39:58.466Z",
      "tempStatus": {
        "name": "failed",
        "updatedAt": "2022-10-08T14:15:40.213Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-05T11:48:47.183Z"
        }
      ]
    },
    {
      "_id": "633ad848ff900218ab5f4c53",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "633ad848ff900218ab5f4c52",
      "status": {
        "name": "completed",
        "updatedAt": "2022-10-05T12:13:05.891Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 3000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 42705,
        "withdrawal_fee": 34.425,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 34.425,
        "amountDeductible": 0,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 2295,
        "grossAmountToWithdraw": 2295,
        "netAmountToWithdraw": 2295
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.095Z",
      "createdOn": "2022-10-03T12:40:40.684Z",
      "tempStatus": {
        "name": "completed",
        "updatedAt": "2022-10-05T12:13:05.891Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-05T12:11:27.157Z"
        }
      ]
    },
    {
      "_id": "63414503b807b5b228f0576a",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "63414503b807b5b228f05769",
      "status": {
        "name": "completed",
        "updatedAt": "2022-10-08T09:58:30.198Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 5000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 0,
        "withdrawal_fee": 75,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 75,
        "amountDeductible": 0,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 45000,
        "grossAmountToWithdraw": 5000,
        "netAmountToWithdraw": 5000
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.096Z",
      "createdOn": "2022-10-08T09:38:11.598Z",
      "tempStatus": {
        "name": "completed",
        "updatedAt": "2022-10-08T09:58:30.198Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-08T09:45:05.891Z"
        }
      ]
    },
    {
      "_id": "6341b21993b07295a7f26606",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "6341b21993b07295a7f26605",
      "status": {
        "name": "completed",
        "updatedAt": "2022-10-08T17:24:50.204Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 15000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 7404.425,
        "withdrawal_fee": 225,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 225,
        "amountDeductible": 0,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 37595.575,
        "grossAmountToWithdraw": 15000,
        "netAmountToWithdraw": 15000
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.097Z",
      "createdOn": "2022-10-08T17:23:37.327Z",
      "tempStatus": {
        "name": "completed",
        "updatedAt": "2022-10-08T17:24:50.204Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-08T17:23:37.327Z"
        }
      ]
    },
    {
      "_id": "6344271e1f5085212da2437c",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "6344271e1f5085212da2437b",
      "status": {
        "name": "completed",
        "updatedAt": "2022-10-10T14:08:20.097Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 10000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 22629.425,
        "withdrawal_fee": 150,
        "withdrawal_charge_mode": "shared",
        "withdrawal_fee_by_employee": 75,
        "withdrawal_fee_by_employer": 75,
        "amountDeductible": 75,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 22370.575,
        "grossAmountToWithdraw": 10000,
        "netAmountToWithdraw": 9925
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.097Z",
      "createdOn": "2022-10-10T14:07:26.335Z",
      "tempStatus": {
        "name": "completed",
        "updatedAt": "2022-10-10T14:08:20.097Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-10T14:07:26.335Z"
        }
      ]
    },
    {
      "_id": "63442f6d7e2a83e4cd543355",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "63442f6c7e2a83e4cd543354",
      "status": {
        "name": "cancelled",
        "updatedAt": "2022-10-10T14:52:31.077Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 10000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 32629.425,
        "withdrawal_fee": 150,
        "withdrawal_charge_mode": "shared",
        "withdrawal_fee_by_employee": 75,
        "withdrawal_fee_by_employer": 75,
        "amountDeductible": 75,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 12370.575,
        "grossAmountToWithdraw": 10000,
        "netAmountToWithdraw": 9925
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.109Z",
      "createdOn": "2022-10-10T14:42:53.029Z",
      "tempStatus": {
        "name": "cancelled",
        "updatedAt": "2022-10-10T14:52:31.077Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-10T14:42:53.029Z"
        }
      ]
    }
  ],
  "filteredWithdrawals": [
    {
      "_id": "633ad848ff900218ab5f4c53",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "633ad848ff900218ab5f4c52",
      "status": {
        "name": "completed",
        "updatedAt": "2022-10-05T12:13:05.891Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 3000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 42705,
        "withdrawal_fee": 34.425,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 34.425,
        "amountDeductible": 0,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 2295,
        "grossAmountToWithdraw": 2295,
        "netAmountToWithdraw": 2295
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.095Z",
      "createdOn": "2022-10-03T12:40:40.684Z",
      "tempStatus": {
        "name": "completed",
        "updatedAt": "2022-10-05T12:13:05.891Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-05T12:11:27.157Z"
        }
      ]
    },
    {
      "_id": "63414503b807b5b228f0576a",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "63414503b807b5b228f05769",
      "status": {
        "name": "completed",
        "updatedAt": "2022-10-08T09:58:30.198Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 5000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 0,
        "withdrawal_fee": 75,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 75,
        "amountDeductible": 0,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 45000,
        "grossAmountToWithdraw": 5000,
        "netAmountToWithdraw": 5000
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.096Z",
      "createdOn": "2022-10-08T09:38:11.598Z",
      "tempStatus": {
        "name": "completed",
        "updatedAt": "2022-10-08T09:58:30.198Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-08T09:45:05.891Z"
        }
      ]
    },
    {
      "_id": "6341b21993b07295a7f26606",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "6341b21993b07295a7f26605",
      "status": {
        "name": "completed",
        "updatedAt": "2022-10-08T17:24:50.204Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 15000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 7404.425,
        "withdrawal_fee": 225,
        "withdrawal_charge_mode": "employer",
        "withdrawal_fee_by_employee": 0,
        "withdrawal_fee_by_employer": 225,
        "amountDeductible": 0,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 37595.575,
        "grossAmountToWithdraw": 15000,
        "netAmountToWithdraw": 15000
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.097Z",
      "createdOn": "2022-10-08T17:23:37.327Z",
      "tempStatus": {
        "name": "completed",
        "updatedAt": "2022-10-08T17:24:50.204Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-08T17:23:37.327Z"
        }
      ]
    },
    {
      "_id": "6344271e1f5085212da2437c",
      "accountID": "XBI2CveEchMIZfmSVYkgA",
      "employeeID": "633235f93ad738e40fe5b59f",
      "companyID": "630f2a2387b40d7834830e0e",
      "transactionID": "6344271e1f5085212da2437b",
      "status": {
        "name": "completed",
        "updatedAt": "2022-10-10T14:08:20.097Z"
      },
      "transactionInfo": {
        "amountRequestedToWithdraw": 10000,
        "resolvedWithdrawAccess": 75,
        "totalAmountWithdrawnOrEarmarked": 22629.425,
        "withdrawal_fee": 150,
        "withdrawal_charge_mode": "shared",
        "withdrawal_fee_by_employee": 75,
        "withdrawal_fee_by_employer": 75,
        "amountDeductible": 75,
        "grossMaxAmountWithdrawable": 45000,
        "netMaxAmountWithdrawable": 22370.575,
        "grossAmountToWithdraw": 10000,
        "netAmountToWithdraw": 9925
      },
      "type": "employee_payment",
      "lastModified": "2022-10-13T13:12:10.097Z",
      "createdOn": "2022-10-10T14:07:26.335Z",
      "tempStatus": {
        "name": "completed",
        "updatedAt": "2022-10-10T14:08:20.097Z"
      },
      "status_history": [
        {
          "name": "initiated",
          "updatedAt": "2022-10-10T14:07:26.335Z"
        }
      ]
    }
  ],
  "totalFilteredWithdrawalRefunds": 32220,
  "totalFilteredWithdrawalFeeByEmployer": 409.425,
  "totalFilteredDebtToPay": 32629.425,
};


let payrollTemplate={
  _id: new ObjectId("634bc5360a16d271d8055a60"),
  companyID: '630f2a2387b40d7834830e0e',
  salaryMonthID: 10,
  salaryYearID: 2022,
  auto_make_payroll_payment: true,
  companyName: 'Datrisoft Initiative',
  /**
   * @type {{name:"fully_paid"|"unpaid"|"failed",updatedAt:Date}}
   */
  totalSalaryPaymentStatus:undefined,
  employeePayrollInfo: {
    _id: [Object],
    employeeTotalWithdrawal: 37182.5,
    employeeGrossSalary: 60000,
    companyID: '630f2a2387b40d7834830e0e',
    companyName: 'Datrisoft Initiative',
    auto_make_payroll_payment: true,
    employeeID: '633235f93ad738e40fe5b59f',
    employeeAccountID:"",
    employeeBankCode: '044',
    employeeBankName: 'ACCESS BANK',
    employeeAccNumber: '0781077095',
    employeeAccRecipientCode: 'RCP_yoc9c5yfuzvwr2w',
    employeeAccName: 'Alabi Olutomi',
    salaryMonthID: 10,
    salaryYearID: 2022,
    /**
     * @type {{name:"initiated"|"completed"|"failed",updatedAt:Date}}
     */
    salary_payment_status:undefined,
    employeeFirstName: 'Olutomi',
    employeeLastName: 'Alabi',
    employeeEmail: 'topeomoalabi@gmail.com',
    employeePhoneNum: '+2348052573344',
    /**
     * @type {[]|string}
     */
    employeeJobTitle: undefined,
    employeeDeptID: '631e0b43df217865eba479c4',
    employeeDepartment: 'Security',
    /**
     * @type {Date}
     */
    prev_salary_date: null,
    /**
     * @type {Date}
     */
    next_salary_date:undefined,
    employeeNetSalary: 22817.5,
    /**
     * @type {Date}
     */
    lastModified:undefined,
    /**
     * @type {Date}
     */
    createdModified:undefined,
  },
  employeesTotalGrossSalaries: 60000,
  employeesTotalNetSalaries: 22817.5,
  /**
   * @type {Date}
   */
  next_salary_date: undefined,
  /**
   * @type {Date}
   */
  prev_salary_date: null,
  /**
   * @type {Date}
   */
  lastModified:undefined,
  /**
   * @type {Date}
   */
  createdModified:undefined,
}

module.exports = {
  calculationItemTemplate,
  accumulationsTemplate,
  debtListTemplate,payrollTemplate
};
