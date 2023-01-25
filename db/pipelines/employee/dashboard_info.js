const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let dashboardInfoAgg = ({accountID}) => {
   let agg = [{
      $match: {
       accountID
      }
     }, {
      $lookup: {
       from: 'employees',
       localField: 'accountID',
       foreignField: 'accountID',
       as: 'employee'
      }
     }, {
      $unwind: {
       path: '$employee'
      }
     }, {
      $set: {
       account_activity: '$activity.current.name',
       companyIDAsObjectID: {
        $toObjectId: '$employee.companyID'
       },
       deptIDAsObjectID: {
        $toObjectId: '$employee.deptID'
       }
      }
     }, {
      $lookup: {
       from: 'users',
       localField: 'accountID',
       foreignField: 'accountID',
       as: 'user'
      }
     }, {
      $unwind: {
       path: '$user'
      }
     }, {
      $lookup: {
       from: 'companies',
       localField: 'companyIDAsObjectID',
       foreignField: '_id',
       as: 'company'
      }
     }, {
      $lookup: {
       from: 'departments',
       localField: 'deptIDAsObjectID',
       foreignField: '_id',
       as: 'department'
      }
     }, {
      $set: {
       company: {
        $first: '$company'
       },
       department: {
        $first: '$department'
       }
      }
     }, {
      $set: {
       employeeID: {
        $toString: '$employee._id'
       },
       companyID: {
        $toString: '$company._id'
       },
       salaryMonthID:'$company.salaryMonthID',
       salaryYearID:'$company.salaryYearID',
       f_name: '$user.f_name',
       l_name: '$user.l_name',
       monthly_salary: {
        $toDouble: '$employee.monthly_salary'
       }
      }
     }, {
      $lookup: {
       from: 'withdrawals',
       localField: 'accountID',
       foreignField: 'accountID',
       as: 'withdrawals'
      }
     }, {
      $set: {
       resolvedFlexibleAccess: {
        access_mode: {
         $ifNull: [
          {
           $let: {
            vars: {
             flexible_access_mode: {
              $first: {
               $let: {
                vars: {
                 flexible_policy_filter: {
                  $filter: {
                   cond: {
                    $eq: [
                     'flexible_access_mode',
                     '$$item.name'
                    ]
                   },
                   input: '$department.dept_policies',
                   as: 'item'
                  }
                 }
                },
                'in': '$$flexible_policy_filter'
               }
              }
             }
            },
            'in': '$$flexible_access_mode.value'
           }
          },
          '$company.flexible_access.access_mode'
         ]
        },
        access_value: {
         $ifNull: [
          null,
          '$company.flexible_access.value'
         ]
        }
       }
      }
     }, {
      $set: {
       filteredWithdrawals: {
        $filter: {
         input: '$withdrawals',
         cond: {
          $and: [
           {
            $in: [
             '$$withdrawal.status.name',
             [
              'completed'
             ]
            ]
           },
           {
            $eq: [
             '$$withdrawal.salaryMonthID',
             '$company.salaryMonthID'
            ]
           },
           {
            $eq: [
             '$$withdrawal.salaryYearID',
             '$company.salaryYearID'
            ]
           }
          ]
         },
         as: 'withdrawal'
        }
       }
      }
     }, {
      $set: {
       resolvedFlexibleAccessValue: '$resolvedFlexibleAccess.access_value',
       resolvedflexibleAccessMode: '$resolvedFlexibleAccess.access_mode',
       filteredWithdrawalCount: {
        $size: '$filteredWithdrawals'
       },
       sumWithdrawal: {
        $reduce: {
         input: '$filteredWithdrawals',
         initialValue: 0,
         'in': {
          $sum: [
           '$$value',
           '$$this.transactionInfo.netAmountToWithdraw'
          ]
         }
        }
       },
       employeeTotalFlexibleAccess: {
        $multiply: [
         {
          $toInt: '$monthly_salary'
         },
         {
          $divide: [
           '$resolvedFlexibleAccess.access_value',
           100
          ]
         }
        ]
       },
       sumWithdrawalFees: {
        $reduce: {
         input: '$filteredWithdrawals',
         initialValue: 0,
         'in': {
          $sum: [
           '$$value',
           '$$this.transactionInfo.withdrawal_fee'
          ]
         }
        }
       },
       sumWithdrawalFeesByEmployee: {
        $reduce: {
         input: '$filteredWithdrawals',
         initialValue: 0,
         'in': {
          $sum: [
           '$$value',
           '$$this.transactionInfo.withdrawal_fee_by_employee'
          ]
         }
        }
       },
       sumWithdrawalFeesByEmployer: {
        $reduce: {
         input: '$filteredWithdrawals',
         initialValue: 0,
         'in': {
          $sum: [
           '$$value',
           '$$this.transactionInfo.withdrawal_fee_by_employer'
          ]
         }
        }
       }
      }
     }, {
      $set: {
       employeeAvailableFlexibleAccess: {
        $subtract: [
         '$employeeTotalFlexibleAccess',
         '$sumWithdrawal'
        ]
       }
      }
     }, {
      $set: {
         employeeNetAmountToEarn:{
           $subtract:[
             "$monthly_salary",
             "$sumWithdrawal"
         ]
         }
      }
     }, {
      $unset: [
       'phonePin',
       'loginInfo',
       'verInfo',
       'activity',
       'companyIDAsObjectID',
       'deptIDAsObjectID',
       'user',
       'employee',
       'company',
       'department',
       'withdrawals',
       'filteredWithdrawals',
       'filteredWithdrawalCount'
      ]
     }]
   return agg;
}

module.exports = dashboardInfoAgg;
