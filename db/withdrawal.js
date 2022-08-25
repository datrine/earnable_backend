const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const walletsCol = db.collection("wallets");
const { ObjectID } = require("bson");

let getTransactionsByCompanyID = async (companyID) => {
    let results = await walletsCol.find({
        companyID
    });
    let transactions = await results.toArray()
    return { transactions }
}

let getWalletByWalletID = async (walletID) => {
    let wallet = await walletsCol.findOne({
        walletID: ObjectID(walletID)
    });
    return { wallet }
}

let createTransaction = async ({  ...data }) => {
    let result = await walletsCol.insertOne({
         ...data,status:"processing",
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

module.exports = { getTransactionsByCompanyID, createTransaction, getOrCreateCompanyWallet, getWalletByWalletID }