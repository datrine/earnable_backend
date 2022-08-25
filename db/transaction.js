const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const accountsCol = db.collection("accounts");
const transactionsCol = db.collection("transactions");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../from/utils/email_mgt");
const { createBiodataFunc } = require("./register");
const { accTemplate } = require("./templates");
const { findAndVerifyToken, saveToken } = require("./token");
const { DateTime } = require("luxon");
const { getRandomToken } = require("../from/utils/token_mgt");
const { loginInfo } = require("./templates/account");
const { sendPhoneText } = require("../from/utils/phone_mgt");
const { ObjectID } = require("bson");

let getTransactionsByCompanyID = async (companyID) => {
    let results = await transactionsCol.find({
        companyID
    });
    let transactions = await results.toArray()
    return { transactions }
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

let getOrCreateCompanyWallet = async ({ companyID }) => {
    let { wallet } = await getTransactionsByCompanyID(companyID);
    if (!wallet) {
        wallet = await createTransaction({ companyID })
    }
    return { wallet }
}

module.exports = { getTransactionsByCompanyID, createTransaction, getOrCreateCompanyWallet, updateTransactionByTransactionID,
    updateAndReturnTransactionByTransactionID }