const router = require("express").Router();
const { mongoClient } = require("../../utils/conn/mongoConn");
const { verifyToken } = require("../../utils/encdec");
const tokenVerifyMW = require("../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const accountsCol = waleprjDB.collection("payments");
const { getAccountMW } = require("../../utils/mymiddleware/accounts");
const { ObjectId } = require("bson");

async function savePaymentDetail({ detail, email, platform, transactionId, orderId, ...rest }) {
    try {
        let paymentResult = await accountsCol.insertOne({
            email,
            detail,
            platform,
            transactionId,
            orderId:ObjectId(orderId),
            ...rest,
            createdOn: new Date(),
            lastModified: new Date()
        });
        return paymentResult.insertedId
    } catch (error) {
        console.log(error)
    }
}

async function updatePaymentDetail({ transactionId, state, ...rest }) {
    try {
        let paymentResult = await accountsCol.updateOne({
            transactionId,
            $and:[{state:{$ne:"successful"}},{state:{$ne:"failed"}}],
            
        }, {$set:{
            state,
            ...rest,
            lastModified: new Date()}
        });
        return paymentResult.result
    } catch (error) {
        console.log(error)
    }
}
module.exports = { savePaymentDetail, updatePaymentDetail }