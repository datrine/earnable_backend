const { DateTime } = require("luxon");
const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const withdrawalsCol = db.collection("withdrawals");

let createWithdrawal = async ({ accountID, employeeID, companyID, amount, withdrawal_fee, transactionID, withdrawal_charge_mode, type = "employee_payment", status = "processing" }) => {
    let result = await withdrawalsCol.insertOne({
        accountID, employeeID, companyID, transactionID, status, amount, withdrawal_fee, withdrawal_charge_mode,
        type,
        lastModified: new Date(),
        createdOn: new Date(),
    });
    if (!result?.insertedId) {
        return { err: { msg: "No withdrawal created." } }
    }
    return { withdrawalID: result.insertedId.toString() }
}

/**
 * 
 * @param {object} param0 
 * @param {string} param0.accountID
 * @param {number} param0.amount
 * @param {"employee"|"employer"|"shared"} param0.withdrawal_charge_moded
 * @param {number} param0.withdrawal_fee
 * @param {"employee_payment"|"employer_payment"} param0.type
 * @param {"initiated"|"processing"|"success"|"failed"} param0.status
 * @returns 
 */
let updateWithdrawalByTransactionID = async ({ transactionID, ...updates }) => {
    let result = await withdrawalsCol.findOneAndUpdate({
        transactionID
    }, {
        $set: {
            ...updates,
            lastModified: new Date()
        }
    });
    if (!result?.ok) {
        return { err: { msg: "No withdrawal created." } }
    }
    return { withdrawalID: result.value._id.toString() }
}

let getEmployeeWithdrawalHistory = async ({ employeeID, filters = {} }) => {
    try {
        let filterQuery;
        if (filters.from && DateTime.fromISO(filters.from)) {
            filterQuery = filterQuery || {};
            filterQuery = { ...filterQuery, $gte: { createdOn: DateTime.fromISO(filters.from).toJSDate() } }
        }
        let historyCursor = await withdrawalsCol.find({ employeeID, ...filterQuery });
        let history = await historyCursor.toArray();
        return { withdrawal_history: history }
    } catch (error) {
        console.log(error);
        throw error
    }

}

let getCompanyEmployeesWithdrawalHistory = async ({ companyID, filters = {} }) => {
    try {
        let filterQuery={};
        if (filters.from && DateTime.fromISO(filters.from)) {
            filterQuery = filterQuery || {};
            filterQuery = { ...filterQuery, $gte: { createdOn: DateTime.fromISO(filters.from).toJSDate() } }
        }
        if (filters.year && DateTime.fromObject({year: filters.year})) {
            filterQuery = filterQuery || {};
            filterQuery = { ...filterQuery, 
                '$eq': [
                    {
                        '$year': '$createdOn'
                    }, DateTime.fromObject({year: filters.year}).year
                ] }
        }
        if (filters.weekNumber && DateTime.fromObject({weekNumber: filters.weekNumber})) {
            filterQuery = filterQuery || {};
            filterQuery = { ...filterQuery, 
                '$eq': [
                    {
                        '$week': '$createdOn'
                    }, DateTime.fromObject({weekNumber: filters.weekNumber}).weekNumber
                ] }
        }
        console.log(filterQuery)
        let historyCursor = await withdrawalsCol.find({ companyID,$expr:filterQuery });
        let history = await historyCursor.toArray();
        return { withdrawal_history: history }
    } catch (error) {
        console.log(error);
        throw error
    }

}

module.exports = {
    createWithdrawal, updateWithdrawalByTransactionID,
    getEmployeeWithdrawalHistory, getCompanyEmployeesWithdrawalHistory
}