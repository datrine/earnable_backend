const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const walletsCol = db.collection("wallets");
const { ObjectID } = require("bson");

let getWalletByCompanyID = async (companyID) => {
    console.log(companyID)
    let wallet = await walletsCol.findOne({
        companyID
    });
    return { wallet }
}

let holdAmountInWallet = async (companyID) => {
    console.log(companyID)
    let { wallet } = await getOrCreateCompanyWallet({ companyID });
    let balance = wallet.balance
    return { wallet }
}
let getWalletByWalletID = async (walletID) => {
    let wallet = await walletsCol.findOne({
        walletID: ObjectID(walletID)
    });
    return { wallet }
}

let createCompanyWallet = async ({ companyID, ...rest }) => {
    let wallet = await walletsCol.insertOne({
        companyID, ...rest,
        createdOn: new Date(),
        lastModified: new Date()
    });
    if (!wallet?.insertedId) {
        return { err: { msg: "No wallet created." } }
    }
    return { walletID: wallet.insertedId.toString() }
}



let getOrCreateCompanyWallet = async ({ companyID, ...rest }) => {
    let { err, wallet } = await getWalletByCompanyID(companyID)
    if (!wallet) {
        let { err, walletID } = await createCompanyWallet({ companyID, ...rest });
        return { err, walletID }
    }
    return { ...wallet, walletID: wallet._id.toString() }
}

let fundWallet = async ({ companyID, walletID, amount, createorMeta, }) => {
    try {
        let result = await walletsCol.updateOne({
            $or: [{ walletID: ObjectID(walletID) }, { companyID }]
        }, {
            $inc: { amount: Number(amount) },
            $set: { lastModified: new Date() },
            $setOnInsert: { companyID, createorMeta, createdOn: new Date(), }
        }, { upsert: true });
        if (!result.acknowledged) {
            return { err: { msg: "Unable to fund this time." } }
        }
        console.log(result)
        return { info: "Wallet was funded" }
    } catch (error) {
        console.log(error);
        return { err: error }
    }
}

module.exports = { getWalletByCompanyID, createCompanyWallet, getWalletByWalletID, fundWallet, getOrCreateCompanyWallet }