const { ObjectId } = require("bson");
const { mongoClient, startConn } = require("../conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const paymentsCol = waleprjDB.collection("payments");
async function getTransactionStateOfOrder({ orderId }) {
    try {
        let payment = await paymentsCol.findOne({
            orderId:ObjectId(orderId),
        });
        return payment;
    } catch (error) {
        console.log(error);
    }
}

module.exports = { getTransactionStateOfOrder }