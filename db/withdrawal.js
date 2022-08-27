const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const withdrawalsCol = db.collection("withdrawals");

let createWithdrawal = async ({ accountID, employeeID, companyID, amount, withdrawal_fee,transactionID, withdrawal_charge_mode, type = "employee_payment", status = "processing" }) => {
    let result = await withdrawalsCol.insertOne({
        accountID, employeeID, companyID,transactionID, status, amount, withdrawal_fee, withdrawal_charge_mode,
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
let updateWithdrawalByTransactionID = async ({transactionID,...updates }) => {
    let result = await withdrawalsCol.findOneAndUpdate({
        transactionID 
    }, {
        $set: {
            ...updates,
            lastModified:new Date()
        }
    });
    if (!result?.ok) {
        return { err: { msg: "No withdrawal created." } }
    }
    return { withdrawalID: result.insertedId.toString() }
}

module.exports = { createWithdrawal, updateWithdrawalByTransactionID }