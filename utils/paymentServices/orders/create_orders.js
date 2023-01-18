const { nanoid } = require("nanoid");
const { mongoClient } = require("../../conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const ordersCol = waleprjDB.collection("orders");

/**
 * 
 * @param {object} order 
 * @param {string} order.creatorEmail
 * @param {[{tier:string, qty:number, 
 * frequency:"weekly"| "monthly"}]} items 
 * @param {object} order.billingInfo
 * @param {number} order.totalPrice
 * @returns 
 */
async function createOrder(order) {
    try {
        let orderCreated = await ordersCol.insertOne({
            ...order,
            state:"created"
        });
        if (!orderCreated) {
            return false;
        }
        return orderCreated
    } catch (error) {

    }
}

/**
 * 
 * @param {[{tier:string, qty:number,price:number, frequency:"weekly"| "monthly"}]} subs 
 * @returns {{items:[subs],totalPrice:number}}
 */
function createSubsOrderItems(subs) {
    let price = 0;
    for (const sub of subs) {
        sub.id = nanoid();
        sub.type="subscription";
        sub.addedAt=new Date();
        price += sub.price;
    }
    let createdOn=new Date();
    let lastModified=new Date();
    return { items: subs, totalPrice: price,createdOn, lastModified }
}

module.exports = { createOrder, createSubsOrderItems }