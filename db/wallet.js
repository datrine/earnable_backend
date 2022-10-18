const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const walletsCol = db.collection("wallets");
const wallet_transactionsCol = db.collection("wallet_transactions");
const { ObjectID } = require("bson");
const { nanoid } = require("nanoid");
const Paystack = require("paystack-api");
const { createPayrollTransactionFromWallet } = require("./transaction");

let getWalletByCompanyID = async (companyID) => {
  let wallet = await walletsCol.findOne({
    companyID,
  });
  return { wallet };
};

let holdAmountInWallet = async ({ companyID, amountToHold, accountID }) => {
  try {
    let wallet = await getOrCreateCompanyWallet({ companyID });
    let balance = Number.isNaN(parseInt(wallet?.balance))
      ? 0
      : Number(parseInt(wallet?.balance));
    let amountOnHold = Number.isNaN(parseInt(wallet?.amountOnHold))
      ? 0
      : Number(parseInt(wallet?.amountOnHold));
    console.log({ balance, amountOnHold, amountToHold });
    if (amountToHold > balance) {
      return { err: { msg: "Insufficient balance" } };
    }
    if (amountOnHold > balance) {
      return { err: { msg: "Insufficient balance" } };
    }
    let updateCondQuery = {
      $and: [
        { $gt: ["$balance", amountToHold] },
        //false
        { $lt: [{ $add: ["$amountOnHold", amountToHold] }, "$balance"] },
      ],
    };

    let withdrawer = {
      accountID,
      amountToHold,
      createdOn: new Date(),
      withdrawID: nanoid(),
    };
    let updateRes = await walletsCol.findOneAndUpdate(
      { companyID },
      [
        {
          $set: {
            amountOnHold: {
              $cond: {
                if: updateCondQuery,
                //if: true,
                then: {
                  $add: [{ $ifNull: ["$amountOnHold", 0] }, amountToHold],
                },
                //then: 60,
                else: { $ifNull: ["$amountOnHold", 0] },
                //else:80
              },
            },
            withdrawers: {
              $cond: {
                if: updateCondQuery,
                //if: true,
                then: {
                  $concatArrays: [
                    {
                      $ifNull: ["$withdrawers", []],
                    },
                    [withdrawer],
                  ],
                },
                //then: 90,
                else: {
                  $ifNull: ["$withdrawers", []],
                },
                //else: 900
              },
            },
            lastModified: {
              $cond: {
                if: updateCondQuery,
                //if: true,
                then: new Date(),
                else: "$lastModified",
              },
            },
          },
        },
      ],
      { returnDocument: "after" }
    );
    let newDoc = updateRes.value;
    if (!newDoc?.withdrawers) {
      return { err: { msg: "Could not process transaction" } };
    }

    let isSaved = !!Array.from(newDoc.withdrawers).find(
      (obj) =>
        obj.accountID === withdrawer.accountID &&
        obj.withdrawID === withdrawer.withdrawID
    );
    if (!isSaved) {
      return { err: { msg: "Could not process transaction" } };
    }
    return { info: "Amount held under lock" };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let createWalletTransaction = async ({
  companyID,
  employeeID,
  accountID,
  salaryMonthID,
  salaryYearID,
  recipient_code,
  amountToPay,
}) => {
  try {
    const session = clientConn.startSession();
    const transactionOptions = {
      readPreference: "primary",
      readConcern: { level: "local" },
      writeConcern: { w: "majority" },
    };
    try {
      let toReturn ;
      await session.withTransaction(async () => {
        let result = await walletsCol.findOneAndUpdate(
          { companyID },
          { $inc: { balance: -amountToPay } },
          { session, returnDocument: "after" }
        );
        if (!result.ok) {
          await session.abortTransaction();
          toReturn= { err: { msg: "Unable to process..." } };
          return
        }
        let updatedWallet = result.value;
        let updatedBalance = updatedWallet.balance;
        console.log(updatedBalance)
        if (updatedBalance <= 0) {
          await session.abortTransaction();
          toReturn= { err: { msg: "Insufficient balance..." } };
           return
        }
        let resultWalletTransaction = await createPayrollTransactionFromWallet({
          employeeID,
          accountID,
          companyID,
          recipient_code,
          salaryMonthID,
          salaryYearID,
          amountToPay,
          session,
        });
        if (resultWalletTransaction.err) {
          console.log(resultWalletTransaction);
          await session.abortTransaction();
          toReturn=resultWalletTransaction
          return ;
        }
        await session.commitTransaction();
        toReturn= resultWalletTransaction;
      }, transactionOptions);
      console.log({toReturn})
      return toReturn;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getWalletByWalletID = async (walletID) => {
  let wallet = await walletsCol.findOne({
    walletID: ObjectID(walletID),
  });
  return { wallet };
};

let createCompanyWallet = async ({ companyID, ...rest }) => {
  let wallet = await walletsCol.insertOne({
    companyID,
    balance: 0,
    ...rest,
    createdOn: new Date(),
    lastModified: new Date(),
  });
  if (!wallet?.insertedId) {
    return { err: { msg: "No wallet created." } };
  }
  return { walletID: wallet.insertedId.toString() };
};

let getOrCreateCompanyWallet = async ({ companyID, ...rest }) => {
  let { err, wallet } = await getWalletByCompanyID(companyID);
  if (!wallet) {
    let { err, walletID } = await createCompanyWallet({ companyID, ...rest });
    return { err, walletID };
  }
  return { ...wallet, walletID: wallet._id.toString() };
};

let fundWallet = async ({ companyID, walletID, amount, createorMeta }) => {
  try {
    let result = await walletsCol.updateOne(
      {
        $or: [{ walletID: ObjectID(walletID) }, { companyID }],
      },
      {
        $inc: { balance: Number(amount) },
        $set: { lastModified: new Date() },
        $setOnInsert: { companyID, createorMeta, createdOn: new Date() },
      },
      { upsert: true }
    );
    if (!result.acknowledged) {
      return { err: { msg: "Unable to fund this time." } };
    }
    return { info: "Wallet was funded" };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

module.exports = {
  getWalletByCompanyID,
  createCompanyWallet,
  getWalletByWalletID,
  fundWallet,
  getOrCreateCompanyWallet,
  holdAmountInWallet,
  createWalletTransaction,
};
