const { response } = require("express");
const { getAccountMW } = require(".");
const { mongoClient } = require("../../conn/mongoConn");
const { verifyToken } = require("../../encdec");
const { defaultCompanyAdminRoles, defaultCompanyActionRoles } = require("../../misc/company_roles");
const { verifyReceipt } = require("../../paymentServices/bills/verifyReceipt");
const waleprjDB = mongoClient.db("waleprj");
const shopsCol = waleprjDB.collection("shops");
const accountsCol = waleprjDB.collection("accounts");
const { verifyPaymentInterface } = require("../../paymentServices/bills/verify/index.js");
const { payFn } = require("../../paymentServices/bills/pay");
const { getOrderFromDB } = require("../../quickGets/order");
const { getTransactionStateOfOrder } = require("../../quickGets/transaction");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let validateServerSidePaymentMW = async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account
        let data = req.body;
        if (!data) {
            console.log("No request body")
            return res.json({ err: "No request body" })
        }
        if (!data.orderId) {
            console.log("No order Id")
            return res.json({ err: "No order Id" })
        }

        if (!data.email) {
            console.log("No email supplied, will use default email.");
            data.email = account.email
        }

        if (!data.platform) {
            console.log("No platform supplied, will default to 'paystack'.");
            data.platform = 'paystack'
        }

        let orderSaved = await getOrderFromDB({ orderId: data.orderId });

        if (!orderSaved) {
            console.log("Order id is not valid.");
            return res.json({ err: "Order id is not valid.", canRetry: true })
        }


        if (orderSaved.state === "canceled") {
            console.log("Order has already been canceled.");
            return res.json({ err: "Order has already been canceled.", canRetry: false })
        }

        if (orderSaved.state === "completed") {
            console.log("Order has already been completed.");
            return res.json({ err: "Order has already been completed.", canRetry: false });
        }

        for (const item of orderSaved.items) {
            if (item.type === "product") {
                console.log("No billing address supplied.");
                return res.json({
                    err: "No billing address supplied. It is required for some items",
                    canRetry: false
                });
            }
        }

        let paymentData = await getTransactionStateOfOrder({ orderId: orderSaved._id })

        console.log(paymentData)
        if (paymentData) {
            if (paymentData.state === "successful") {
                console.log("Payment has been completed for this order.");
                return res.json({ err: "Payment has been completed for this order.", canRetry: false })
            }

            if (paymentData.state === "initialized") {
                console.log("Payment has been initialized for this order.");
                return res.json({ err: "Payment has been initialized for this order.", canRetry: false })
            }
        }


        let resultOfPaymentVerification = await payFn({
            orderId: data.orderId,
            email: data.email,
            amount: orderSaved.totalPrice,
            platform: data.platform
        });

        if (!resultOfPaymentVerification) {
            console.log("Payment failed.")
            return res.json({ err: "Payment failed", canRetry: true })
        }
        res.status(200)
        return res.json({ ...resultOfPaymentVerification })
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};


module.exports = { validateServerSidePaymentMW };