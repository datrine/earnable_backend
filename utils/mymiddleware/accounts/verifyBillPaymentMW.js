
const { verifyReceipt } = require("../../paymentServices/bills/verifyReceipt");

const { verifyPaymentInterface } = require("../../paymentServices/bills/verify/index.js");


/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let verifyServerSidePaymentMW = async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account
        let data = req.body;
        if (!data) {
            console.log("No request body")
            return res.json({ err: "No request body" })
        }
        if (!data.transactionId) {
            console.log("No transaction Id")
            return res.json({ err: "No transaction Id" })
        }

        if (!data.email) {
            console.log("No email supplied, will use default email.");
            data.email = account.email
        }
        let resultOfPaymentVerification = await verifyPaymentInterface({
            transactionId: data.transactionId,
        })
        if (!resultOfPaymentVerification) {
            console.log("Payment verification failed.")
            return res.json({ err: "Payment verification failed", canRetry: true })
        }
        let { amount } = resultOfPaymentVerification;
        let resultOfReceiptVerification =
            await verifyReceipt({ orderId: data.orderId, amountPaid: amount })
        if (!resultOfReceiptVerification) {
            console.log("Receipt verification failed.")
            return res.json({ err: "Receipt verification failed. Try again", canRetry: true })
        }
        res.status(200)
        return next()
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};


module.exports = { verifyServerSidePaymentMW };