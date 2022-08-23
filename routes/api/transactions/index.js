const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const ordersCol = waleprjDB.collection("orders")
const { validateServerSidePaymentMW } = require("../../../utils/mymiddleware/accounts/validateServerSidePaymentMW");
const { createCompanyWallet, getWalletByCompanyID } = require("../../../db/wallet");
const { getAuthAccount } = require("../../../from/utils/middlewares/getAuthAccount");
const { getToken } = require("../../../utils/encdec");
const { transactionTokenVerMW } = require("../../../utils/mymiddleware/transactionTokenMWs");
const { canWithdrawVerMW } = require("../../../utils/mymiddleware/canWithdrawMW");
const { createTransaction } = require("../../../db/transaction");
const { getBankDetailsByAccountID, createRecipientCode, updateRecieptCodeEmployeeID, initiateTransfer } = require("../../../db/bank_detail");

router.post("/new/create", getAuthAccount, transactionTokenVerMW, canWithdrawVerMW, async (req, res, next) => {
    try {
        let { transactionToken, bank_code, amount, withdrawal_fee, bank_name, l_name, f_name, acc_number, acc_name, timestamp_started } = req.body;
        let total_amount = amount + withdrawal_fee;
        let bank_details = { bank_code, bank_name, acc_number, acc_name }
        let transRes = await createTransaction({ transactionToken, total_amount, timestamp_started, bank_details });
        res.json(transRes);
        let { bankDetails } = await getBankDetailsByAccountID({ accountID });
        if (!bankDetails) {
        }
        let bankDetailID = bankDetails.bankDetailID;
        let matchSavedBankDetails = (bank_code === bankDetails.bank_code) && (acc_number === bankDetails.acc_number);
        if (!matchSavedBankDetails) {

        }
        let recipient_code = bankDetails.recipient_code
        if (!recipient_code) {
            let createRes = await createRecipientCode({ l_name, f_name, acc_number, bank_code, bankDetailID });
            if (!createRes.recipient_code) {
                console.log("ooooooooo")
                return
            }
            recipient_code=createRes.recipient_code
           let updateRes=await updateRecieptCodeEmployeeID({ bankDetailID, recipient_code });
        }
      let transferInitiationRes=await  initiateTransfer({reason:"Earnable payment",amount,recipient:recipient_code});
      
        let data = req.body
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