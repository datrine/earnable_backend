const router = require("express").Router();
const withdrawalsRouter = require("./withdrawals");
const refundsRouter = require("./refunds");
const walletsRouter = require("../wallets");
const transactionIDRouter = require("./[transactionID]");

// /withdrawals paths
router.use("/withdrawals", withdrawalsRouter);

// /refunds paths
router.use("/refunds", refundsRouter);

// /refunds paths
router.use("/wallets", walletsRouter);

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
