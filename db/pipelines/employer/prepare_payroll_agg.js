const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let prepareCompanyPayrollAgg = () => {
  let { companyID } = filters;
  let matchFilters = {
    $match: {
      $expr: {
        $lt: [companyID, { $toObjectId: "$_id" }],
      },
    },
  };
  let agg = preparePayrollAgg({ matchFilters });

  return agg;
};

let prepareAllPayrollAgg = () => {
  let matchFilters = {
    $match: {
      $expr: {
        $lt: ["$next_salary_date", "$$NOW"],
      },
      settings: {
        $elemMatch: {
          name: "auto_make_payroll_payment",
          value: true,
        },
      },
    },
  };
  let agg = preparePayrollAgg({ matchFilters });

  return agg;
};

let preparePayrollAgg = ({ matchFilters }) => {
  let agg = [
    {
      $set: {
        companyID: {
          $toString: "$_id",
        },
        auto_make_payroll_payment: {
          $let: {
            vars: {
              find: {
                $first: {
                  $filter: {
                    input: "$settings",
                    cond: {
                      $eq: ["$$setting.name", "auto_make_payroll_payment"],
                    },
                    as: "setting",
                  },
                },
              },
            },
            in: {
              $eq: ["$$find.value", true],
            },
          },
        },
        payment_mode: {
          $let: {
            vars: {
              find: {
                $first: {
                  $filter: {
                    input: "$settings",
                    cond: {
                      $eq: ["$$setting.name", "payment_mode"],
                    },
                    as: "setting",
                  },
                },
              },
            },
            in: "$$find.value",
          },
        },
      },
    },
    {
      $lookup: {
        from: "wallets",
        localField: "companyID",
        foreignField: "companyID",
        as: "wallet",
      },
    },
    {
      $set: {
        companyWalletBalance: {
          $first: "$wallet",
        },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "companyID",
        foreignField: "companyID",
        as: "employee",
      },
    },
    {
      $unwind: {
        path: "$employee",
      },
    },
    {
      $set: {
        employeeID: {
          $toString: "$employee._id",
        },
      },
    },
    {
      $set: {
        employeeAccountID: "$employee.accountID",
      },
    },
    {
      $lookup: {
        from: "accounts",
        localField: "employeeAccountID",
        foreignField: "accountID",
        as: "account",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "employeeAccountID",
        foreignField: "accountID",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "bank_details",
        localField: "employeeAccountID",
        foreignField: "accountID",
        as: "bankDetail",
      },
    },
    {
      $set: {
        accountInfo: {
          $first: "$account",
        },
        userInfo: {
          $first: "$user",
        },
        bankDetail: {
          $first: "$bankDetail",
        },
      },
    },
    {
      $unwind: {
        path: "$employee",
      },
    },
    {
      $set: {
        employeeID: {
          $toString: "$employee._id",
        },
        employeeDeptID: {
          $toString: "$employee.deptID",
        },
        employeeSalary: {
          $toDouble: "$employee.monthly_salary",
        },
      },
    },
    {
      $set: {
        employeeDeptID: {
          $toObjectId: "$employee.deptID",
        },
      },
    },
    {
      $lookup: {
        from: "withdrawals",
        localField: "employeeID",
        foreignField: "employeeID",
        as: "withdrawal",
      },
    },
    {
      $lookup: {
        from: "departments",
        localField: "employeeDeptID",
        foreignField: "_id",
        as: "department",
      },
    },
    {
      $set: {
        department: {
          $first: "$department",
        },
      },
    },
    {
      $unwind: {
        path: "$withdrawal",
      },
    },
    {
      $match: {
        "withdrawal.status.name": "completed",
        $expr: {
          $and: [
            {
              $eq: ["$salaryMonthID", "$withdrawal.salaryMonthID"],
            },
            {
              $eq: ["$salaryMonthID", "$withdrawal.salaryMonthID"],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          employeeID: "$employeeID",
          salaryMonthID: "$salaryMonthID",
          salaryYearID: "$salaryYearID",
        },
        employeeTotalWithdrawal: {
          $sum: "$withdrawal.transactionInfo.netAmountToWithdraw",
        },
        employeeGrossSalary: {
          $first: {
            $toDouble: "$employee.monthly_salary",
          },
        },
        companyID: {
          $first: "$companyID",
        },
        companyName: {
          $first: "$company_name",
        },
        companyWalletBalance: {
          $first: "$companyWalletBalance.balance",
        },
        auto_make_payroll_payment: {
          $first: "$auto_make_payroll_payment",
        },
        payment_mode: {
          $first: "$payment_mode",
        },
        employeeID: {
          $first: "$employeeID",
        },
        employeeAccountID: { $first: "$employeeAccountID" },
        employeeBankCode: {
          $first: "$bankDetail.bank_code",
        },
        employeeBankName: {
          $first: "$bankDetail.bank_name",
        },
        employeeAccNumber: {
          $first: "$bankDetail.acc_number",
        },
        employeeAccRecipientCode: {
          $first: "$bankDetail.recipient_code",
        },
        employeeAccName: {
          $first: "$bankDetail.acc_name",
        },
        salaryMonthID: {
          $first: "$salaryMonthID",
        },
        salaryYearID: {
          $first: "$salaryYearID",
        },
        employeeFirstName: {
          $first: "$userInfo.f_name",
        },
        employeeLastName: {
          $first: "$userInfo.l_name",
        },
        employeeEmail: {
          $first: "$accountInfo.email",
        },
        employeePhoneNum: {
          $first: "$accountInfo.phonenum",
        },
        employeeJobTitle: {
          $first: "$employee.job_title",
        },
        employeeDeptID: {
          $first: "$employee.deptID",
        },
        employeeDepartment: {
          $first: "$department.dept_name",
        },
        prev_salary_date: {
          $first: "$prev_salary_date",
        },
        next_salary_date: {
          $first: "$next_salary_date",
        },
      },
    },
    {
      $set: {
        employeeNetSalary: {
          $subtract: ["$employeeGrossSalary", "$employeeTotalWithdrawal"],
        },
        lastModified: "$$NOW",
        createdOn: "$$NOW",
      },
    },
    {
      $group: {
        _id: {
          companyID: "$companyID",
        },
        companyID: {
          $first: "$companyID",
        },
        companyName: {
          $first: "$companyName",
        },
        companyWalletBalance: {
          $first: "$companyWalletBalance",
        },
        salaryMonthID: {
          $first: "$salaryMonthID",
        },
        auto_make_payroll_payment: {
          $first: "$auto_make_payroll_payment",
        },
        payment_mode: {
          $first: "$payment_mode",
        },
        salaryYearID: {
          $first: "$salaryYearID",
        },
        employeesTotalNetSalaries: {
          $sum: "$employeeNetSalary",
        },
        employeesTotalGrossSalaries: {
          $sum: "$employeeGrossSalary",
        },
        employeePayrollInfo: {
          $push: "$$ROOT",
        },
        prev_salary_date: {
          $first: "$prev_salary_date",
        },
        next_salary_date: {
          $first: "$next_salary_date",
        },
      },
    },
    {
      $set: {
        lastModified: "$$NOW",
        createdOn: "$$NOW",
      },
    },
    {
      $unset: "_id",
    },
  ];
  return agg;
};

module.exports = {
  prepareAllPayrollAgg,
  prepareCompanyPayrollAgg,
  preparePayrollAgg,
};
