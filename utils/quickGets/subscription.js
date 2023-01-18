const { mongoClient, startConn } = require("../conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
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