const router = require("express").Router()
const { mongoClient, ObjectID } = require("../conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const productsCol = waleprjDB.collection("products");
const ordersCol = waleprjDB.collection("orders");
const $ = require("mongo-dot-notation");
const { nanoid } = require("nanoid");
const { uniq } = require("lodash");

let validateProductOrders = async ({ account, productOrders, }) => {
    try {
        let prices = []
        let items = []
        let map = new Map();

        productOrders.forEach(order => {
            let { shopId, ...restOfItem } = order
            let shopProd = map.get(order.shopId);
            if (!shopProd) {
                return map.set(shopId, [order])
            }
            shopProd.push(order)

        });
        console.log(map)
        for (const order of productOrders) {
            if (!order.productId) {
                console.log("No product id");
                throw { err: "No product id", item: order };
            }
            if (!ObjectID.isValid(order.productId)) {
                console.log("No product id");
                throw { err: "No product id", item: order };
            }
            if (!order.shopId) {
                console.log("No shop id");
                throw { err: "No shop id", item: order };
            }
            if (!ObjectID.isValid(order.shopId)) {
                console.log("Shop id not valid");
                throw { err: "Shop id not valid", item: order };
            }
        }

        let queriesForSavedProducts =
            productOrders.map(({ productId, shopId, }) => {
                console.log(shopId)
                return productsCol.findOne({
                    _id: ObjectID(productId),
                    shopId: ObjectID(shopId),
                });
            });

        for await (const query of queriesForSavedProducts) {
            let productSaved = query;
            if (!productSaved) {
                throw "Item not found..."
            }
            let { itemId, productId, qty = 1, quantifier = "unit" } =
                productOrders.find(order => order.productId === productSaved._id.toString());
            let priceObjs = productSaved.priceInfo.priceObjs
            let priceObj = priceObjs.find(obj => obj.quantifier === (quantifier || "unit"));
            if (!priceObj) {
                throw "Item price not found...";
            }
            let price = priceObj.price * qty;
            let itemTotalPrice = price;
            let item = {
                qty,
                name: productSaved.name,
                price: itemTotalPrice,
                productId,
                itemId: itemId || nanoid(),
                type: "product",
                addedAt: new Date()
            };
            prices.push(itemTotalPrice)
            items.push(item)
        }
        return { items, prices }
    } catch (error) {
        console.log(error)
        throw error
    }
};

module.exports = { validateProductOrders };