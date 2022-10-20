const router = require("express").Router();
const {
  getAuthAccount,
} = require("../../../from/utils/middlewares/getAuthAccount");
const {
  transactionTokenVerMW,
} = require("../../../utils/mymiddleware/transactionTokenMWs");
const {
  canWithdrawVerMW,
} = require("../../../utils/mymiddleware/canWithdrawMW");
const {
  createTransaction,
  getTransactionByID,
  updateTransactionByID,
} = require("../../../db/transaction");
const {
  createRecipientCode,
  updateRecieptCodeEmployeeID,
  initiateTransfer,
} = require("../../../db/bank_detail");
const { sendOTPMW } = require("../../../utils/mymiddleware/sendOTPMW");
const {
  generateOTPToken,
} = require("../../../from/utils/middlewares/generateTokenMW");
const {
  canContinueWithdrawMW,
} = require("../../../utils/mymiddleware/canContinueWithdrawMW");
getTransactionByID;
const { createWithdrawal } = require("../../../db/withdrawal");
const { DateTime } = require("luxon");
const {
  resolveTransactionMW,
} = require("../../../utils/mymiddleware/transactionMWs");
const { canRefundMW } = require("../../../utils/mymiddleware/canRefundMW"); // Require the library
const { nanoid } = require("nanoid");
const { paystackInitiate } = require("../../../utils/payments/paystack");
const { createRefund } = require("../../../db/refund");

// post: /refunds/new/initiate
router.post(
  "/new/initiate",
  async (req, res, next) => {
    let queried = { accountID: req.query.accountID };
    queried = {
      ...queried,
      amount: req.body.amount,
      salaryMonthID: req.body.salaryMonthID,
      salaryYearID: req.body.salaryYearID,
      payment_mode:"resolve_all"
    };
    req.session.queried = { ...req.session.queried, ...queried };
    next();
  },
  getAuthAccount,
  canRefundMW,
  async (req, res, next) => {
    try {
      let {
        company: { companyID, payment_email },
        account: { accountID },
        amount,
      } = req.session.queried;
      let payment_reference = nanoid();
      let paystackInitiateRes = await paystackInitiate({
        email: payment_email,
        amount: amount * 100,
        reference: payment_reference,
      });
      if (paystackInitiateRes.err) {
        return res.json(paystackInitiateRes);
      }
      let { data: paystackInitiateData } = paystackInitiateRes;
      if (paystackInitiateData.status === false) {
        return res.json({ err: { msg: paystackInitiateData.message } });
      }

      let transRes = await createTransaction({
        accountID,
        amountToRefund: amount,
        transaction_reference: paystackInitiateData.data.reference,
        paystackData: paystackInitiateData.data,
        type: "refund",
      });
      // res.json(transRes);
      req.session.transactionID = transRes.transactionID;
      let { transactionID } = transRes;
      await createRefund({
        accountID,
        companyID,
        transactionID,
        amount_refunded: amount,
        purpose: "refund",
        status: { name: "initiated", updatedAt: new Date() },
      });
      res.json({ ...paystackInitiateData, transactionID });
    } catch (error) {
      console.log(error);
    }
  }
);

// post: /:transactionID/withdrawals/continue
router.post(
  "/verify",
  getAuthAccount,
  transactionTokenVerMW,
  async (req, res, next) => {
    try {
      let { transaction } = req.session.queried;
      let { amountToWithdraw } = transaction;
      req.session.queried.amount = amountToWithdraw;
      next();
    } catch (error) {
      console.log(error);
    }
  },
  canWithdrawVerMW,
  async (req, res, next) => {
    try {
      let {
        bank_details: queriedBankDetails,
        transactionID: queriedTransactionID,
        account: queriedAccount,
        transaction: queriedTransaction,
      } = req.session.queried;
      let transRes = await updateTransactionByID({
        transactionID: queriedTransactionID,
        updates: {
          status: "processing",
          accountIDofUpdater: queriedAccount.accountID,
        },
        update_processing_attempts: true,
      });

      if (transRes.err) {
        return res.json(transRes);
      }

      res.json({ info: transRes.info });

      let recipient_code = queriedBankDetails.recipient_code;

      if (!recipient_code) {
        let createRes = await createRecipientCode({ ...queriedBankDetails });
        if (!createRes.recipient_code) {
          return;
        }
        recipient_code = createRes.recipient_code;
        let bankDetailID = queriedBankDetails.bankDetailID;
        let updateRes = await updateRecieptCodeEmployeeID({
          bankDetailID,
          recipient_code,
        });
      }

      let to_pay = transRes.value?.amountToWithdraw;
      let transferInitiationRes = await initiateTransfer({
        reason: "Earnable payment",
        amount: to_pay * 100,
        recipient: recipient_code,
      });

      if (transferInitiationRes.err) {
        let err = transferInitiationRes.err;
        if (err?.type === "failed_transfer") {
          let transactionUpdateRes = await updateTransactionByID({
            transactionID: queriedTransactionID,
            updates: {},
            update_processing_attempts: true,
          });
        }
        return;
      }

      let transferCode = transferInitiationRes.transfer_code;

      if (!transferCode) {
        console.log("No transfer code");
        return;
      }
      let transactionUpdateRes = await updateTransactionByID({
        transactionID: queriedTransactionID,
        updates: {
          transfer_code: transferCode,
          accountIDofUpdater: queriedAccount.accountID,
          status: "completed",
        },
      });
      if (transactionUpdateRes.err) {
        console.log(transactionUpdateRes);
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }
);

// get path: /:transactionID/refunds/status
router.get("/status", async (req, res, next) => {
  try {
    let { transaction } = req.session.queried;
    if (!transaction) {
      return res.json({
        err: { msg: "No Transaction found that matches supplied transaction" },
      });
    }
    let status = transaction?.status.name;
    return res.json({ status });
  } catch (error) {
    console.log(error);
  }
});

// get: /:transactionID/withdrawals/cancel
router.get(
  "/cancel",
  async (req, res, next) => {
    try {
      let { transactionID } = req.params;
      if (!transactionID) {
        return res.json({ err: { msg: "No Transaction ID supplied" } });
      }
      req.session.queried = { ...req.session.queried, transactionID };
      next();
    } catch (error) {
      console.log(error);
    }
  },
  getAuthAccount,
  async (req, res, next) => {
    try {
      let { transactionID: queriedtransactionID } = req.session.queried;
      let { account: authAccount } = req.session.self;
      let cancelTransactionByIDRes = await updateTransactionByID({
        transactionID: queriedtransactionID,
        updates: {
          status: "cancelled",
          accountIDofUpdater: authAccount.accountID,
        },
      });
      if (cancelTransactionByIDRes.err) {
        return res.json(cancelTransactionByIDRes);
      }
      res.json(cancelTransactionByIDRes);
    } catch (error) {
      console.log(error);
    }
  }
);

module.exports = router;
