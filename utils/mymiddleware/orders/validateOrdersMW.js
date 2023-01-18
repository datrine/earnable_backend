const { mongoClient, ObjectID } = require("../../conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const ordersCol = waleprjDB.collection("orders");
const { validateProductOrders } = require("../../dbValidate/order");

let validateOrders = async (req, res, next) => {
    try {
        let account = req.session.account
        let { rejectIfItemNotFound = false, items: orderRequests } = req.body;
        let items = [];
        if (!orderRequests) {
            console.log("No items to purchase");
            return res.json({ err: "No items to purchase" });
        }

        if (!Array.isArray(orderRequests)) {
            console.log(" 'items' must be an array");
            return res.json({ err: " 'items' must be an array" });
        }

        if (orderRequests.length < 1) {
            console.log(" order must contain at least one item");
            return res.json({ err: "order must contain at least one item" });
        }
        let productOrders = []
        for (const orderRequest of orderRequests) {
            if (typeof orderRequest !== "object") {
                console.log(" Wrong item format");
                return res.json({ err: "Wrong item format" });
            }
            if (!orderRequest.type) {
                console.log("Item type not set");
                return res.json({ err: "Item type not set. e.g product, subcription, services" });
            }
            if (orderRequest.type === "product") {
                productOrders.push(orderRequest)
            }
        }

        let prodValRes = await validateProductOrders({ account, productOrders });

        items.push(...prodValRes.items)

        if (!items) {
            console.log("No items to save...")
            return res.json({ err: "No items to save" });
        }

        let totalPrice = items.reduce((sum, item) => sum + item.price, 0);
        console.log(totalPrice)
        let result = await ordersCol.insertOne({
            accountID: account.accountID,
            totalPrice,
            items,
            createdOn: new Date(),
            state: "initialized",
            lastModified: new Date(),
            totalPrice
        }, {});
        if (!result.insertedId) {
            console.log("Unable to save...")
            return res.json({ err: "Unable to save order" });
        }
        res.status(200)
        return res.json({ orderId: result.insertedId, });
    } catch (error) {
        console.log(error);
        res.status(error.statusCode || 500)
        res.json({ err: error.msg || error });
    }
};

module.exports = { validateOrders };