const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const paymentsCol = waleprjDB.collection("payments")
var crypto = require('crypto');
var secret = 'sk_test_9b43dbc08afbbb51848c736377fb8915be9b969e'

router.post("/", (req, res, next) => {
    //validate event
    var hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (hash == req.headers['x-paystack-signature']) {
        // Retrieve the request's body
        var event = req.body;
        eventProcessor(event)
        res.end()
        // Do something with event  
    } else {
        console.log("sorry");
        res.json({ err: "Nope, it's a miss" })
    }
});

async function eventProcessor(eventData) {
    switch (eventData.event) {
        case "charge.dispute.create":
            break;
        case "charge.dispute.remind":
            break;
        case "charge.dispute.resolve":
            break;
        case "charge.success":
            await paymentRequestSuccesful(eventData);
            break;
        case "customeridentification.failed":
            break;
        case "customeridentification.success":
            break;
        case "invoice.create":
            break;
        case "invoice.payment_failed":
            break;
        case "invoice.update":
            break;
        case "paymentrequest.pending":
            await paymentRequestPending(eventData);
            break;
        case "paymentrequest.success":
            //await paymentRequestSuccesful(eventData);
            break;
        case "subscription.create":
            break;
        case "subscription.disable":
            break;
        case "subscription.enable":
            break;
        case "transfer.failed":
            break;
        case "transfer.success":
            break;
        case "transfer.reversed":
            break;

        default:
            break;
    }
}

async function paymentRequestPending({data}) {
    try {
        let result = await paymentsCol.updateOne({
            transactionId: data.reference,
        }, {
            $set: {
                state: "pending",
                lastModified: new Date()
            }
        });
       // console.log(result.result);
    } catch (error) {
        console.log(error)
    }
}


async function paymentRequestSuccesful({data}) {
    console.log(data)
    try {
        let result = await paymentsCol.updateOne({
            transactionId: data.reference,
        }, {
            $set: {
                state: "successful",
                lastModified: new Date()
            }
        });
        console.log(result.result);
    } catch (error) {
        console.log(error)
    }
}
module.exports = router;