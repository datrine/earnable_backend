

const { mongoClient } = require("../../../utils/conn/mongoConn");
//console.log(mongoClient.isConnected())
const waleprjDB = mongoClient.db("waleprj");
module.exports = { mongoClient, waleprjDB, startAllStreams }
const startWatchingShops = require("./shops");
const { startWatchingPayments } = require("./payments");
const { startWatchingOrders } = require("./orders");

async function startAllStreams() {
    startWatchingShops()
    startWatchingPayments()
    startWatchingOrders()
}
