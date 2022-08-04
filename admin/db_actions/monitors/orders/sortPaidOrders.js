
const { mongoClient, waleprjDB } = require("..");
const { getExpiresOn } = require("../../../../utils/paymentServices/tiering/tiershop");
const ordersCol = waleprjDB.collection("orders");
const shippingsCol = waleprjDB.collection("shipping");

async function sortSubscriptionsOrders({ email, subOrders }) {
    try {
        let userSubData = await subscriptionsCol.findOne({
            email,
        });
        if (!userSubData) {
            console.log("No previous subscriptions. Creating")
            let subs = await subscriptionsCol.findOneAndUpdate({
                email
            }, {
                $setOnInsert: {
                    email,
                    subs: subOrders,
                }
            }, { upsert: true });
            return true
        }
        let presentSubs = userSubData.subs;
        let tempArray = []
        for (const newSub of subOrders) {
            let presentSub = presentSubs.find(sub => sub.name === newSub.name)
            if (presentSub) {
                if (presentSub.orderId===newSub.orderId) {
                    console.log("Already subscribed...")
                    break;
                }
                let timeDiff = new Date(presentSub.expiresOn) - new Date()
                let time_remaining = Math.max(timeDiff, 0);
                if (newSub.name === "shop") {
                    let expiresOn = getExpiresOn({
                        qty: newSub.qty,
                        frequency: newSub.frequency
                    });
                    if (!presentSub.tier === "free") {
                        let accumTime = expiresOn.getTime() + time_remaining
                        expiresOn = new Date(accumTime);
                    }
                    newSub.expiresOn = expiresOn;
                    newSub.lastModified = new Date();
                    newSub.active = true
                }
            }
            tempArray.push(newSub)
        }
        let updateOneArray=[]
            console.log("tempArray: "+tempArray.length);
        for (const sub of tempArray) {
            const updateOne = {
                filter: {
                    email,
                    "subs.name": { $eq: sub.name },
                    // "subs.isActive":{$ne:true}
                },
                // arrayFilters: [{ "sub.name": { $eq: sub.name } }],
                update: {
                    $set:{
                        "subs.$":sub
                    }
                },
                // upsert: true
            }
            updateOneArray.push({ updateOne });
        }
        if (updateOneArray.length<1) {
            console.log("No subscription updates made");
            return true;
        }
        let result2 = await subscriptionsCol.bulkWrite([...updateOneArray,]);
        if (result2.writeErrors) {
            console.log((JSON.stringify(result.writeErrors, null, 2)));
            return false
        }
        console.log("Subscription successful");
        return true;
    } catch (error) {
        console.log(error)
    }
}

async function sortProductsOrders({ order, productOrders }) {
    try {
        if (!order.billingInfo) {
            console.log("No billing info");
            return false;
        }
        let result=await shippingsCol.insertOne({
            state:"ready",
            billingInfo:order.billingInfo,
            items:productOrders
        });
        console.log("shipping id: "+result.insertedId)
        return true;
    } catch (error) {
        console.log(error)
    }
}
module.exports = { sortSubscriptionsOrders,sortProductsOrders };