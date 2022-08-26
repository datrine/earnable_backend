const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const ordersCol = waleprjDB.collection("orders")
const { validateServerSidePaymentMW } = require("../../../utils/mymiddleware/accounts/validateServerSidePaymentMW");
const { createCompanyWallet, getWalletByCompanyID, holdAmountInWallet } = require("../../../db/wallet");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");
const { getToken } = require("../../../utils/encdec");
const { transactionTokenVerMW } = require("../../../utils/mymiddleware/transactionTokenMWs");
const { canWithdrawVerMW } = require("../../../utils/mymiddleware/canWithdrawMW");
const { createTransaction, updateTransactionByTransactionID, updateAndReturnTransactionByTransactionID } = require("../../../db/transaction");
const { getBankDetailsByAccountID, createRecipientCode, updateRecieptCodeEmployeeID, initiateTransfer } = require("../../../db/bank_detail");
const { sendOTPMW } = require("../../../utils/mymiddleware/sendOTPMW");
const { generateOTPToken } = require("../../../from/utils/middlewares/generateTokenMW");
const { canContinueWithdrawMW } = require("../../../utils/mymiddleware/canContinueWithdrawMW");

router.post("/withdrawals/new/initiate", getAuthAccount, canWithdrawVerMW, async (req, res, next) => {
    try {
        let { amount, withdrawal_fee, } = req.body;
        let { company, department, } = req.session;
        let withdrawal_charge_mode = (Array.isArray(department?.policies) &&
            Array.from(department?.policies).find(policy => policy.name === "withdrawal_charge_mode")) ||
            company?.withdrawal_charge_mode || "employee"
        let employee_details = req.session.employee_details
        let companyID = company?.companyID;
        let accountID = employee_details?.accountID;
        let bank_details = req.session.bank_details;
        if (withdrawal_charge_mode === "employee") {
            amount = amount - withdrawal_fee;
        }
        if (withdrawal_charge_mode === "shared") {
            amount = amount - (withdrawal_fee / 2);
        }
        let total_amount = amount + withdrawal_fee;
        let holdRes = await holdAmountInWallet({ companyID, amountToHold: total_amount, accountID });
        if (holdRes?.err) {
            return res.json(holdRes)
        }
        let to_pay = { withdrawal: amount };
        let transRes = await createTransaction({
            accountID,
            type: "withdrawal",
            total_amount,
            to_pay,
            to_earn: { withdrawal_fee },
            bank_details
        });
        if (transRes.err) {
            return res.json(transRes)
        }
        res.json(transRes);
        next()
    } catch (error) {
        console.log(error)
    }
}, generateOTPToken, sendOTPMW, async (req, res, next) => {
    console.log("pikoihuggyggytfrsypoj")
});

router.post("/:transactionID/withdrawals/continue", async (req, res, next) => {
    try {
        let { transactionID } = req.params;
        req.session.transactionID = transactionID;
        next()
    } catch (error) {

    }
}, getAuthAccount, transactionTokenVerMW, canContinueWithdrawMW, async (req, res, next) => {
    try {
        let bank_details = req.session.bank_details;
        let { transactionID } = req.params
        let transRes = await updateAndReturnTransactionByTransactionID({ transactionID, status: "processing" });
        if (transRes.err) {
            return res.json(transRes)
        }
        res.json(transRes);
        let recipient_code = bank_details.recipient_code
        if (!recipient_code) {
            let createRes = await createRecipientCode({ ...bank_details });
            if (!createRes.recipient_code) {
                return
            }
            recipient_code = createRes.recipient_code
            let bankDetailID = bank_details.bankDetailID
            let updateRes = await updateRecieptCodeEmployeeID({ bankDetailID, recipient_code });
        }
        let to_pay = transRes.transaction.to_pay?.withdrawal;
        let transferInitiationRes = await initiateTransfer({
            reason: "Earnable payment",
            amount: to_pay * 100,
            recipient: recipient_code
        });
        if (transferInitiationRes.err) {
            console.log(transferInitiationRes);
            return
        }
        let transferReference = transferInitiationRes.reference
        let transactionUpdateRes = await updateTransactionByTransactionID({ transactionID, transferReference });
        if (transactionUpdateRes.err) {
            console.log(transactionUpdateRes);
            return;
        }
    } catch (error) {
        console.log(error)
    }
});

router.post("/", async (req, res, next) => {
    try {
        let { companyID, walletID } = req.body;

        if (companyID) {
            let walletRes = await createCompanyWallet({ companyID, });
            console.log(walletRes);
            return res.json(walletRes)
        }
    } catch (error) {
        console.log(error)
    }
});


router.get("/:companyID", async (req, res, next) => {
    try {
        let { companyID, walletID } = req.params
        if (companyID) {
            let walletRes = await getWalletByCompanyID();
            console.log(walletRes);
            return res.json(walletRes)
        }
    } catch (error) {
        console.log(error)
    }
});


module.exports = router;