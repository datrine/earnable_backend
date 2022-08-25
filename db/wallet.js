const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const walletsCol = db.collection("wallets");
const { ObjectID } = require("bson");
const { nanoid } = require("nanoid");

let getWalletByCompanyID = async (companyID) => {
    console.log(companyID)
    let wallet = await walletsCol.findOne({
        companyID
    });
    return { wallet }
}

let holdAmountInWallet = async ({ companyID, amountToHold, accountID }) => {
    try {
        console.log(companyID)
        let { wallet } = await getOrCreateCompanyWallet({ companyID });
        let balance = Number.isNaN(wallet?.balance) ? 0 : Number(wallet?.balance);
        let amountOnHold = Number.isNaN(wallet?.amountOnHold) ? 0 : amountOnHold;
        console.log({ balance, amountOnHold, amountToHold })
        if (amountToHold > balance) {
            return { err: { msg: "Insufficient balance" } }
        }
        if (amountOnHold > balance) {
            return { err: { msg: "Insufficient balance" } }
        }
        let updateCondQuery = {
            $and: [
                { $gt: ["$balance", amountToHold] },
                //false
                { $lt: [{ $add: ["$amountOnHold", amountOnHold] }, "$balance"] }
            ]
        }
        let withdrawer = { accountID, amountToHold, createdOn: new Date(), withdrawID: nanoid() }
        let updateRes = await walletsCol.findOneAndUpdate({ companyID, }, [{
            $set: {
                amountOnHold: {
                    $cond: {
                        if: updateCondQuery,
                        //if: true,
                        then: { $add: ["$amountOnHold", amountToHold] },
                        //then: 60,
                        else: "$amountOnHold"
                        //else:80
                    }
                },
                withdrawers: {
                    $cond: {
                        if: updateCondQuery,
                        //if: true,
                        then: { $concatArrays: ["$withdrawers", [withdrawer]] },
                        //then: 90,
                        else: "$withdrawers"
                        //else: 900
                    }
                },
                lastModified: {
                    $cond: {
                        if: updateCondQuery,
                        //if: true,
                        then: new Date(),
                        else: "$lastModified"
                    }
                }
            }
        }], { returnDocument: "after" });
        let newDoc = updateRes.value;
        if (!newDoc?.withdrawers) {
            return { err: { msg: "Could not process transaction" } }
        }

        let isSaved = !!Array.from(newDoc.withdrawers).find(obj => obj.accountID === withdrawer.accountID && obj.withdrawID === withdrawer.withdrawID)
        if (!isSaved) {
            return { err: { msg: "Could not process transaction" } }
        }
        console.log(updateRes)
        return { info: "Amount held under lock" }
    } catch (error) {
        console.log(error)
    }

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

module.exports = { getWalletByCompanyID, createCompanyWallet, getWalletByWalletID, fundWallet, getOrCreateCompanyWallet, holdAmountInWallet }