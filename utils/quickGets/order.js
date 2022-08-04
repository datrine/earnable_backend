const { mongoClient, startConn,ObjectID } = require("../conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const ordersCol = waleprjDB.collection("orders");


async function getOrderFromDB({ orderId }) {
    try {
        let order = await ordersCol.findOne({
            _id:ObjectID(orderId),
        });
        console.log(order)
        return order;
    } catch (error) {
        console.log(error);
    }
}

async function getByOrdersFromDB({ email }) {
    try {
        let orders=[]
        let cursor = await ordersCol.find({
            _id:ObjectID(orderId),
        });
        orders=await cursor.toArray()
        return orders;
    } catch (error) {
        console.log(error);
    }
}

async function getSubscriptionsFromOrder({ orderId }) {
    try {
        let order =await getOrderFromDB({orderId});
        if (!order) {
            return
        }
        let subscriptions=[]
        for (const item of order.items) {
            if (item.type==="subscription") {
                subscriptions.push(item)
            }
        }
        return subscriptions;
    } catch (error) {
        console.log(error);
    }
}

module.exports = { getOrderFromDB,getSubscriptionsFromOrder,getByOrdersFromDB }