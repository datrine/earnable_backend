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

let getWalletByWalletID = async (walletID) => {
    let wallet = await transactionsCol.findOne({
        walletID: ObjectID(walletID)
    });
    return { wallet }
}

let createTransaction = async ({ platform, status, ...data }) => {
    let result = await transactionsCol.insertOne({
        platform, ...data, status,
        lastModified: new Date(),
        createdOn: new Date(),
    });
    if (!result?.insertedId) {
        return { err: { msg: "No wallet created." } }
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

module.exports = { getTransactionsByCompanyID, createTransaction, getOrCreateCompanyWallet, getWalletByWalletID }