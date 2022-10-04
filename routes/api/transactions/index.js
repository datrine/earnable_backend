const router = require("express").Router();
const {
  validateServerSidePaymentMW,
} = require("../../../utils/mymiddleware/accounts/validateServerSidePaymentMW");
const {
  createCompanyWallet,
  getWalletByCompanyID,
  holdAmountInWallet,
} = require("../../../db/wallet");
const {
  getAuthAccount,
} = require("../../../from/utils/middlewares/getAuthAccount");
const { getToken } = require("../../../utils/encdec");
const {
  transactionTokenVerMW,
} = require("../../../utils/mymiddleware/transactionTokenMWs");
const {
  canWithdrawVerMW,
} = require("../../../utils/mymiddleware/canWithdrawMW");
const {
  createTransaction,
  updateTransactionByTransactionID,
  updateAndReturnTransactionByTransactionID,
  getTransactionByID,
  updateTransactionByID,
} = require("../../../db/transaction");
const {
  getBankDetailsByAccountID,
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
const { retrieveAccountInfoByAccountID } = require("../../../db/account");

// get: /withdrawals/new/preview
router.get(
  "/withdrawals/new/preview",
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
  "/withdrawals/new/initiate",
  async (req, res, next) => {
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
        company: { companyID },
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
        purpose: "employee_payment",
        status: "initiated",
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

// use: /:transactionID/withdrawals
router.use("/:transactionID/withdrawals", async (req, res, next) => {
  try {
    let { transactionID } = req.params;
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
});

// post: /:transactionID/withdrawals/continue
router.post(
  "/:transactionID/withdrawals/continue",
  getAuthAccount,
  transactionTokenVerMW,
  async (req, res, next) => {
    try {
      let { transaction } = req.session.queried;
      let { amountToWithdraw } = transaction;
      console.log({ amountToWithdraw });
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
      } = req.session.queried;
      let transRes = await updateTransactionByID({
        transactionID: queriedTransactionID,
        updates: {
          status: "processing",
          accountIDofUpdater: queriedAccount.accountID,
        },
      });
      if (transRes.err) {
        return res.json(transRes);
      }
      res.json({ info: transRes.err });
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
      let to_pay = transRes.value.transaction?.amountToWithdraw;
      let transferInitiationRes = await initiateTransfer({
        reason: "Earnable payment",
        amount: to_pay * 100,
        recipient: recipient_code,
      });
      if (transferInitiationRes.err) {
        let err = transferInitiationRes.err;
        console.log(transferInitiationRes);
        if (err?.type === "failed_transfer") {
          let updates = {};
          let transactionUpdateRes = await updateTransactionByID({
            transactionID: queriedTransactionID,
            update_processing_attempts: true,
          });
        }

        return;
      }
      let transferCode = transferInitiationRes.transfer_code;
      let transactionUpdateRes = await updateTransactionByTransactionID({
        transactionID: queriedTransactionID,
        transferCode,
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

// get: /:transactionID/withdrawals/otp/resend
router.get(
  "/:transactionID/withdrawals/otp/resend",
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

// get: /withdrawals/:transactionID/status
router.get("/:transactionID/withdrawals/status", async (req, res, next) => {
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
  "/:transactionID/withdrawals/cancel",
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
