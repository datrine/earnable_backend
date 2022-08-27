const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const transactionsCol = db.collection("transactions");
const { ObjectID } = require("bson");
const { verifyTransfer } = require("./bank_detail");
const { transferVerifyResponseObj } = require("./templates/paystack/responses");
const { createWithdrawal, updateWithdrawalByTransactionID } = require("./withdrawal");
const { getEmployeeByAccountID } = require("./employee");
const { registerJob } = require("../jobs");
const { CronJob } = require("cron");

let getTransactionsByCompanyID = async (companyID) => {
    let results = await transactionsCol.find({
        companyID
    });
    let transactions = await results.toArray()
    return { transactions }
}

let getTransactionByTransactionID = async ({ transactionID, ...updates }) => {
    try {

        let transaction = await transactionsCol.findOne({
            _id: ObjectID(transactionID)
        });
        if (!transaction) {
            return { err: { msg: `Transaction ${transactionID}` } }
        }
        return { transaction }
    } catch (error) {
        console.log(error);
        return { err: error }
    }
}

let updateTransactionByTransactionID = async ({ transactionID, ...updates }) => {
    let result = await transactionsCol.findOneAndUpdate({
        _id: ObjectID(transactionID)
    }, { $set: { ...updates, lastModified: new Date() }, });
    if (!result.ok) {
        return { err: { msg: `Failed to update transaction ${transactionID}` } }
    }
    return { info: "Transaction updated" }
}

let updateAndReturnTransactionByTransactionID = async ({ transactionID, ...updates }) => {
    let result = await transactionsCol.findOneAndUpdate({
        _id: ObjectID(transactionID)
    }, { $set: { ...updates, lastModified: new Date() }, }, { returnDocument: "after" });
    if (!result.ok) {
        return { err: { msg: `Failed to update transaction ${transactionID}` } }
    }
    return { info: "Transaction updated", transaction: result.value }
}

let createTransaction = async ({ ...data }) => {
    let result = await transactionsCol.insertOne({
        ...data, status: "initiated",
        lastModified: new Date(),
        createdOn: new Date(),
    });
    if (!result?.insertedId) {
        return { err: { msg: "No trasanction created." } }
    }
    return { transactionID: result.insertedId.toString() }
}


let transactionWork = async () => {
    try {
        console.log("transactionWork doingpojnjnjnjnhbh...")
        let listOfProcessingTransactionsCursor = await transactionsCol.find({ status: "processing" });
        let listOfProcessingTransactions = await listOfProcessingTransactionsCursor.toArray();
        console.log(listOfProcessingTransactions.length)
        for await (const transaction of listOfProcessingTransactions) {
            let transactionID = transaction._id.toString();
            let transfer_code = transaction.transferCode;
            console.log(transfer_code)
            console.log(transactionID)
            if (!transfer_code) {
                continue;
            }
            let { data } = await verifyTransfer({ transfer_code });
            if (data) {
                if (data.status === "success") {
                    let updateRes = await updateAndReturnTransactionByTransactionID({ transactionID, status: "success" });
                    if (updateRes.transaction) {
                        let withdrawalUpdateRes = await updateWithdrawalByTransactionID({ transactionID, status: "success" });
                        console.log(withdrawalUpdateRes)
                    }
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
}
let job = new CronJob("0 * * * * *", () => {
    console.log("transactionWork doing...")
    transactionWork()
}, () => {
    console.log("transactionWork done...")
});
job.start()


module.exports = {
    getTransactionsByCompanyID, createTransaction, getTransactionByTransactionID, updateTransactionByTransactionID,
    updateAndReturnTransactionByTransactionID
}