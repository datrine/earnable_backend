const composeEmail = require("../../../../utils/emailServices/composeEmail");
const { mongoClient, waleprjDB } = require("..");
const ordersCol = waleprjDB.collection("orders")
const ordersChangeStream = ordersCol.watch({ fullDocument: 'updateLookup' });
const { sortSubscriptionsOrders, sortProductsOrders } = require("./sortPaidOrders");
const { ObjectId } = require("bson");

function startWatchingOrders() {
    ordersChangeStream.on("change", evt => {
        console.log(evt.operationType === "insert");
        switch (evt.operationType) {
            case "update":
                sortOrders(evt.fullDocument)
                break;
            default:
                break;
        }
    });
}

async function sortOrders(order) {
    if (order.state === "ready") {
        let res = await sortOrderItems({
            order
        });
        if (!res) {
            return
        }
        ordersCol.findOneAndUpdate({
            _id: ObjectId(order._id),
        }, {
            $set: {
                state: "completed"
            }
        })
    }
    if (order.state === "completed") {
        console.log("Order completed...")
    }
}



async function sortOrderItems(order) {
    let { items:orderItems,_id: orderId, email }=order
    let canOrderComplete = false;
    let subsAccum = [];
    let productsAccum = [];
    for (const item of orderItems) {
        item.orderId = orderId
        if (item.type === "subscription") {
            subsAccum.push(item)
        }
        else if (item.type === "product") {
            productsAccum.push(item)
        }
    }
    canOrderComplete = !!await sortSubscriptionsOrders({ subOrders: subsAccum, email });
    canOrderComplete = !!await sortProductsOrders({ productOrders: productsAccum,order });
    return canOrderComplete;
}
module.exports = { startWatchingOrders };