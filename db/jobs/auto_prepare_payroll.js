const {
  prepareAllPayrollAgg,
  persistPayrollAgg,
} = require("../pipelines/employer");
const { mongoClient } = require("../../utils/conn/mongoConn");
const DB_NAME=process.env.DB_NAME
const waleprjDB = mongoClient.db(DB_NAME);
const companiesCol = waleprjDB.collection("companies");
//const payrollsCol = waleprjDB.collection("payrolls");

let autoPreparePayrolls = async () => {
  try {
    let agg = prepareAllPayrollAgg();
      let payrollsCol = waleprjDB.collection("payrolls"); 
      let index = await payrollsCol.createIndex(
        { salaryMonthID: 1, salaryYearID: 1, companyID: 1 },
        { name: "payroll_unique", unique: true }
      );
      console.log(index);
    let cursor = await companiesCol.aggregate(persistPayrollAgg({ agg }));
    cursor.toArray();
    //console.log(cursor);
    return { info: "Payroll persisted..." };
  } catch (error) {
    console.log(error);
    throw { err: error };
  }
};

module.exports = { autoPreparePayrolls };

/*[{
 $match: {
  auto_make_payroll_payment: true
 }
}, {
 $unwind: {
  path: '$employeePayrollInfo'
 }
}]*/
