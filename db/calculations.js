const { ObjectID } = require("bson");
const { DateTime } = require("luxon");
const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const { dashboardInfoAgg } = require("./pipelines/employee");
const {
  composeGetCalculatedListAgg,
  composeGetAccumulationsAgg,
  composeGetDebtListAgg,
  calculateRefundAgg,
  getPaymentListAgg,
} = require("./pipelines/employer");
const {
  calculationItemTemplate,
  accumulationsTemplate,
} = require("./templates");
const { debtListTemplate } = require("./templates/calculations");
const db = clientConn.db("waleprj");
const employeesCol = db.collection("employees");
const accountsCol = db.collection("accounts");
const companiesCol = db.collection("companies");

function dateIsValid(date) {
  return date instanceof Date && !isNaN(date);
}

let getEmployeesSumOfWithdrawn = async ({ filters = {} }) => {
  try {
    let { err, accumulationObj } = await getCalculatedAccumulations({
      filters,
    });
    return {
      totalFlexibleWithdrawal: accumulationObj?.accumulatedTotalWithdrawals,
      filters,
    };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getCalculatedAccumulations = async ({ filters }) => {
  try {
    let agg = composeGetAccumulationsAgg(filters);
    let cursor = await employeesCol.aggregate(agg);
    /**
     * @type {[accumulationsTemplate]}
     */
    let docs = await cursor.toArray();
    return { accumulationObj: docs[0], filters };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getDebtList = async ({ filters }) => {
  try {
    let agg = composeGetDebtListAgg(filters);
    let cursor = companiesCol.aggregate(agg);
    /**
     * @type {[debtListTemplate]}
     */
    let docs = await cursor.toArray();
    return { debt_list: docs };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getCalculatedList = async ({ filters }) => {
  try {
    let agg = composeGetCalculatedListAgg(filters);
    let cursor = await employeesCol.aggregate(agg);
    /**
     * @type {[calculationItemTemplate]}
     */
    let docs = await cursor.toArray();
    return { list: docs };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getTotalFlexibleAccess = async ({
  filters = { accountID, employeeID, companyID, deptID },
}) => {
  try {
    //let cursor = await employeesCol.aggregate(agg);calculationItemTemplate
    let { err, accumulationObj } = await getCalculatedAccumulations({
      filters,
    });
    let totalFlexibleAccess =
      accumulationObj.accumulatedTotalFlexibleAccess || 0;
    return { totalFlexibleAccess };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getReconciliationReport = async ({
  filters = { accountID, employeeID, companyID, deptID },
}) => {
  try {
    let { err, list } = await getCalculatedList({
      filters,
    });
    return { reconciliation_report: list };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getTotalNetPayMethod1 = async ({ filters }) => {
  try {
    let promises = await Promise.allSettled([
      getEmployeesSumOfWithdrawn({ filters }),
      getTotalFlexibleAccess({ filters }),
    ]);
    let totalFlexibleWithdrawal = 0;
    let employeesTotalFlexibleAccess = 0;
    for (const promResult of promises) {
      if (promResult.status === "rejected") {
        return { err: promResult.reason };
      } else if (promResult.value.err) {
        return { err: promResult.value.err };
      }
      if (promResult.value.employeesTotalFlexibleAccess) {
        employeesTotalFlexibleAccess =
          promResult.value.employeesTotalFlexibleAccess;
      }
      if (promResult.value.totalFlexibleWithdrawal) {
        totalFlexibleWithdrawal = promResult?.value?.totalFlexibleWithdrawal;
      }
    }
    let totalNetPay = employeesTotalFlexibleAccess - totalFlexibleWithdrawal;
    return { totalNetPay };
  } catch (error) {
    console.log(error);
  }
};

let getEmployeeNetEarning = async ({ filters = {} }) => {
  try {
    if (!filters?.employeeID) {
      return { err: { msg: "employeeID not supplied..." } };
    }
    let { err, list } = await getCalculatedList({ filters });
    let firstDoc = list[0];
    return { totalNetPay: firstDoc?.employeeTotalNetPay };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

let getTotalNetPay = async ({ filters = {} }) => {
  try {
    let { err, list } = await getCalculatedList({ filters });
    let firstDoc = list[0];
    return { totalNetPay: firstDoc?.employeeTotalNetPay };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

let getTotalWithdrawalCount = async ({ filters = {} }) => {
  try {
    let { err, accumulationObj={} } = await getCalculatedAccumulations({
      filters,
    });
    let { totalFilteredWithdrawals: withdrawal_count } = accumulationObj;
    //console.log({ accumulationObj, filters });
    return { withdrawal_count ,filters};
  } catch (error) {
    console.log(error);
    throw error;
  }
};

let getAvailableFlexibleAccess = async ({ filters = {} }) => {
  try {
    let { err, accumulationObj } = await getCalculatedAccumulations({
      filters,
    });
    return {
      availableFlexibleAccess:
        accumulationObj.accumulatedAvailableFlexibleAccess,
      filters,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

let getPaymentListForCompany = async ({ filters = {} }) => {
  try {
    let agg= getPaymentListAgg(filters);
   let cursor= companiesCol.aggregate(agg);
   let list=await cursor.toArray();

    return {
      companyPaymentList:list
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

let getDashboardInfoForEmployee = async ({ filters = {} }) => {
  try {
    let agg= dashboardInfoAgg(filters);
   let cursor= accountsCol.aggregate(agg);
   let result=await cursor.toArray();
let employeeDashboardInfo=result[0]
    return {
      employeeDashboardInfo
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
module.exports = {
  getEmployeesSumOfWithdrawn,
  getTotalFlexibleAccess,
  getTotalNetPayMethod1,
  getTotalNetPay: getEmployeeNetEarning,
  getEmployeeNetEarning,
  getCalculatedAccumulations,
  getAvailableFlexibleAccess,
  getTotalNetPay,
  getReconciliationReport,
  getDebtList,
  getTotalWithdrawalCount,getPaymentListForCompany,getDashboardInfoForEmployee
};
