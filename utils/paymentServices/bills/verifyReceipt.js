const { mongoClient } = require("../../conn/mongoConn");
const waleprj = mongoClient.db("waleprj");
const ordersCol = waleprj.collection("orders");

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