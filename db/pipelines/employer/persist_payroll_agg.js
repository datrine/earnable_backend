const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let persistPayrollAgg = ({agg=[]}) => {
  let mergePipeline =  {
    $merge: {
     into: 'payrolls',
     on: ['salaryMonthID','salaryYearID','companyID'],
     whenMatched:"keepExisting"
    }
   }
agg.push(mergePipeline)
  return agg;
};

module.exports = persistPayrollAgg;
