const composeEmail = require("../../../../utils/emailServices/composeEmail");
const { mongoClient, waleprjDB } = require("..");
const paymentsCol = waleprjDB.collection("payments")
const ordersCol = waleprjDB.collection("orders")
const paymentsChangeStream = paymentsCol.watch({ fullDocument: 'updateLookup' });
const { ObjectID } = require("bson");
const { verifyPaymentInterface } = require("../../../../utils/paymentServices/bills/verify");

async function startWatchingPayments() {
    paymentsChangeStream.on("change", async evt => {
        try {
            console.log(evt.operationType === "insert");
            switch (evt.operationType) {
                case "insert":
                    await sortPaymentInsert(evt.fullDocument)
                    break;
                case "update":
                    await sortPayment(evt.fullDocument)
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.log(error)
        }
    });
}

async function sortPaymentInsert(payment) {
    try {
        if (payment.state === "initialized") {
            await verifyPaymentInterface({ transactionId: payment.transactionId, 
                platform: payment.platform });
        }
    } catch (error) {

    }
}



async function sortPayment(payment) {
    try {
        console.log("proof")
        if (payment.state === "successful") {
            await updateOrder({ orderId: payment.orderId, state: "ready" });
        }
    } catch (error) {

    }
}



async function updateOrder({ orderId, state }) {
    try {
        let result = await ordersCol.updateOne({
            _id: ObjectID(orderId)
        }, {
            $set: {
                state,
                lastModified: new Date()
            }
        });
        console.log(result.result)
    } catch (error) {
        console.log(error)
    }

}
module.exports = { startWatchingPayments };