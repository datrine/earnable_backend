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
getTransactionByID;
const { createWithdrawal } = require("../../../db/withdrawal");
const {
  resolveTransactionMW,
} = require("../../../utils/mymiddleware/transactionMWs");
const { retrieveAccountInfoByAccountID } = require("../../../db/account");

// get: /withdrawals/new/preview
router.get(
  "/new/preview",
  async (req, res, next) => {
    let queried = { ...req.query };
    req.session.queried = { ...req.session.queried, ...queried };
    next();
  },
  getAuthAccount,
  canWithdrawVerMW,
  resolveTransactionMW,
  async (req, res, next) => {
    try {
      let { transactionInfo } = req.session.queried;
      res.json({ transactionInfo });
    } catch (error) {
      console.log(error);
    }
  }
);

// post: /withdrawals/new/initiate
router.post(
  "/new/initiate",
  async (req, res, next) => {
    console.log({accountID:req.query})
    let queried = { accountID: req.query.accountID };
    queried = { ...queried, amount: req.body.amount };
    req.session.queried = { ...req.session.queried, ...queried };
    next();
  },
  getAuthAccount,
  canWithdrawVerMW,
  resolveTransactionMW,
  async (req, res, next) => {
    try {
      let {
        company: { companyID, salaryMonthID, salaryYearID },
        department: { departmentID },
        employee_details: { employeeID },
        transactionInfo,
        account: { accountID },
      } = req.session.queried;
      let transRes = await createTransaction({
        accountID,
        amountToWithdraw: transactionInfo.netAmountToWithdraw,
        type: "withdrawal",
      });
      res.json(transRes);
      req.session.transactionID = transRes.transactionID;
      let { transactionID } = transRes;
      await createWithdrawal({
        accountID,
        employeeID,
        companyID,
        departmentID,
        transactionID,
        transactionInfo,
        salaryMonthID,
        salaryYearID,
        purpose: "employee_payment",
        status: { name: "initiated", updatedAt: new Date() },
      });
      next();
    } catch (error) {
      console.log(error);
    }
  },
  generateOTPToken,
  sendOTPMW,
  async (req, res, next) => {
    console.log("OTP sent...");
  }
);

// post: /:transactionID/withdrawals/continue
router.post(
  "/continue",
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

// get path: /:transactionID/withdrawals/otp/resend
router.get(
  "/otp/resend",
  getAuthAccount,
  async (req, res, next) => {
    let { transaction } = req.session.queried;
    if (transaction.status.name !== "initiated") {
      return res.json({
        err: { msg: `transaction status: ${transaction.status.name}` },
      });
    }
    let transactionAccountID = transaction.accountID;
    let retrieveAccountInfoByAccountIDRes =
      await retrieveAccountInfoByAccountID(transactionAccountID);
    if (retrieveAccountInfoByAccountIDRes.err) {
      return res.json(retrieveAccountInfoByAccountIDRes);
    }
    req.session.queried.account = retrieveAccountInfoByAccountIDRes.account;
    next();
  },
  generateOTPToken,
  sendOTPMW,
  async (req, res, next) => {
    try {
      res.json({ info: "Sent..." });
    } catch (error) {
      console.log(error);
    }
  }
);

// get path: /:transactionID/withdrawals/status
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
