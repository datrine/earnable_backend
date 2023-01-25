const router = require("express").Router();
const withdrawalsRouter = require("./withdrawals");
const refundsRouter = require("./refunds");
const walletsRouter = require("../wallets");
const transactionIDRouter = require("./[transactionID]");
const {
  getAuthAccount,
} = require("../../../from/utils/middlewares/getAuthAccount");
const { retrieveAccountInfoByAccountID } = require("../../../db/account");
const { getTransactionsByAccountID } = require("../../../db/transaction");

// /withdrawals paths
router.use("/withdrawals", withdrawalsRouter);

// /refunds paths
router.use("/refunds", refundsRouter);

// /refunds paths
router.use("/wallets", walletsRouter);

// get: /transactions/list?
router.get(
  "/list",
  async (req, res, next) => {
    try {
      req.session.queried = { ...req?.session?.queried };
      let { accountID, ...restOf } = req.query;
      req.session.queried.filters={accountID,...restOf}
      if (!accountID) {
        next();
      }
      let { err, account } = await retrieveAccountInfoByAccountID(accountID);
      if (err) {
        return res.json({ err });
      }
      req.session.queried.account = account;
      req.session.queried.accountID = accountID;
      console.log({restOf,accountID})
      next();
    } catch (error) {
      console.log(error);
    }
  },
  async (req, res, next) => {
    try {
      let filters = req.session.queried.filters;
      console.log(filters)
      let getTransactionsByIDRes = await getTransactionsByAccountID({
        ...filters
      });
      if (getTransactionsByIDRes.err) {
        return res.json(getTransactionsByIDRes);
      }
      res.json(getTransactionsByIDRes);
    } catch (error) {
      console.log(error);
    }
  }
);

// /withdrawals paths
router.use(
  "/:transactionID",
  async (req, res, next) => {
    let { transactionID } = req.params;
    req.session.queried = { ...req.session.queried, transactionID };
    next();
  },
  transactionIDRouter
);

module.exports = router;
