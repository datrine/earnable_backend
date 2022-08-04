const { mongoClient, startConn } = require("../conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const subscriptionsCol = waleprjDB.collection("subscriptions");
async function getSubscriptionFromDB({ email }) {
    try {
        let subscription = await subscriptionsCol.findOne({
            email,
        });
        return subscription;
    } catch (error) {
        console.log(error);
    }
}

module.exports = { getSubscriptionFromDB }