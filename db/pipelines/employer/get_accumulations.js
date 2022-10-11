const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");
const composeGetCalculatedListAgg = require("./get_calculated_list");

let composeGetAccumulationsAgg = (filters) => {
    let agg = composeGetCalculatedListAgg(filters)
    let accumulator={$group:{
      _id: null,
      accumulatedTotalWithdrawals: {
        $sum: "$sumWithdrawal"
      },
      accumulatedTotalFlexibleAccess: {
        $sum: "$employeeTotalFlexibleAccess"
      },
      accumulatedAvailableFlexibleAccess: {
        $sum: "$employeeAvailableFlexibleAccess"
      },
      accumulatedTotalSalaries: {
        $sum: "$monthly_salary"
      },
      accumulatedTotalNetPay: {
        $sum: "$employeeTotalNetPay"
      },
      accumulatedWithdrawalFees: {
        $sum: "$sumWithdrawalFees"
      },
      accumulatedWithdrawalFeesByEmployee: {
        $sum: "$sumWithdrawalFeesByEmployee"
      },
      accumulatedWithdrawalFeesByEmployer: {
        $sum: "$sumWithdrawalFeesByEmployer"
      },
      accumulatedReconciledDebts:{$sum:"$employeeReconciledDebt"},
      totalWithdrawingEmployees:{$count:{}},
      totalFilteredWithdrawals:{$sum:"$filteredWithdrawalCount"}
    }}
    agg.push(accumulator)
  return agg;
};

module.exports = composeGetAccumulationsAgg;
