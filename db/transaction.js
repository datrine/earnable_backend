const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const transactionsCol = db.collection("transactions");
const { ObjectID } = require("bson");
const { verifyTransfer } = require("./bank_detail");

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
        return {err:error}
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
    }, { $set: { ...updates, lastModified: new Date() }, },{returnDocument:"after"});
    if (!result.ok) {
        return { err: { msg: `Failed to update transaction ${transactionID}` } }
    }
    return { info: "Transaction updated",transaction:result.value }
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

let transactionWork=async()=>{
    try {
        let listOfProcessingTransactionsCursor=await transactionsCol.find({status:"processing"});
        let listOfProcessingTransactions=await listOfProcessingTransactionsCursor.toArray();
        for (const transaction of listOfProcessingTransactions) {
            let reference=transaction.reference;
            if (reference) {
                continue;
            }
            let pou=  await verifyTransfer({reference})
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = { getTransactionsByCompanyID, createTransaction, getTransactionByTransactionID, updateTransactionByTransactionID,
    updateAndReturnTransactionByTransactionID }