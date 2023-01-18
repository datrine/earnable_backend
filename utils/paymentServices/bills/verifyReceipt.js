const { mongoClient } = require("../../conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const ordersCol = waleprjDB.collection("orders");

async function verifyReceipt({ orderId, amountPaid, transaction }) {
    try {
        let order = await ordersCol.findOne({
            _id: orderId,
            totalAmount: { $lte: Number(amountPaid) }
        });
        if (!order) {
            return false;
        }
        return !!order
    } catch (error) {

    }
}

module.exports = { verifyReceipt }