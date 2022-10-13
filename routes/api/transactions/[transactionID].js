const router = require("express").Router();
const { retrieveAccountInfoByAccountID } = require("../../../db/account");
const { getTransactionByID } = require("../../../db/transaction");
const withdrawalsRouter = require("./withdrawals");
const refundsRouter = require("./refunds");
const walletsRouter = require("../wallets");

router.use("/", async (req, res, next) => {
  try {
    let { transactionID } = req.session.queried;
    if (!transactionID) {
      return res.json({ err: { msg: "No Transaction ID supplied" } });
    }
    let getTransactionByIDRes = await getTransactionByID({
      transactionID,
    });
    if (getTransactionByIDRes.err) {
      return res.json(getTransactionByIDRes);
    }
    req.session.queried = {
      ...req.session.queried,
      transactionID,
      transaction: getTransactionByIDRes.transaction,
    };
    let transactionAccountID = getTransactionByIDRes.transaction.accountID;
    let retrieveAccountInfoByAccountIDRes =
      await retrieveAccountInfoByAccountID(transactionAccountID);
    if (retrieveAccountInfoByAccountIDRes.err) {
      return res.json(retrieveAccountInfoByAccountIDRes);
    }
    req.session.queried.account = retrieveAccountInfoByAccountIDRes.account;
    req.session.queried.accountID =
      retrieveAccountInfoByAccountIDRes.account.accountID;
    next();
  } catch (error) {
    console.log(error);
  }
} ,(req, res, next) => {
  next();
});

// use: /:transactionID/withdrawals
router.use("/withdrawals",withdrawalsRouter);

// use: /:transactionID/refunds
router.use("/refunds",refundsRouter);

// use: /:transactionID/refunds
router.use("/wallets",walletsRouter);
module.exports = router;
