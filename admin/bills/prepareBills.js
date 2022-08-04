
const schedule = require('node-schedule');

const { mongoClient } = require("../../utils/conn/mongoConn");
//console.log(mongoClient.isConnected())
const waleprjDB = mongoClient.db("waleprj");
const subsCol = waleprjDB.collection("subscriptions");

const jobFindAllSubscriptions = schedule.scheduleJob("0/15 * * * * ?", async () => {
    try {
        let subsNoneFree = await subsCol.find({
            "subs": { $elemMatch: { "subs.type": { $ne: "free" } } }
        });
        let sub;
        while (sub = await subsNoneFree.next()) {
            console.log(sub)
        }
    } catch (error) {
        console.log(error)
    }
})

async function makeBill(params) {
    
}

module.exports = { jobFindAllSubscriptions }
