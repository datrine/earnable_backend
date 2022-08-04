const router = require("express").Router();
const { nanoid } = require("nanoid");
const { mongoClient } = require("../../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const subscriptionsCol = waleprjDB.collection("subscriptions");
const { validateSubscriptionMW } = require("../../../../utils/mymiddleware/accounts/validateSubscriptionMW");
const { tierCompany } = require("../../../../utils/paymentServices/tiering/tiershop");
const { getSubscriptionsFromOrder } = require("../../../../utils/quickGets/order");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let mwPay = async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account;
        let { orderId } = req.body;
        let subsOrdered = await getSubscriptionsFromOrder({ orderId });

        if (!subsOrdered) {
            return res.json({ err: { msg: "No order created.", id: "no_sub_order" } })
        }

        subsOrdered = subsOrdered.map(sub => tierCompany(sub))

        let result = await subscriptionsCol.findOneAndUpdate({
            accountID: account.accountID
        }, {
            $setOnInsert: {
                accountID: account.accountID,
                subs: [],
            }, $set: {
                lastModified: new Date()
            }
        }, {
            upsert: true,
            returnNewDocument: true
        });

        let subscription = result.value;
        if (!subscription) {
            throw "No subscription data"
        }

        let { subs: subsSaved } = subscription;

        for (const orderSub of subsOrdered) {
            orderSub.state = "active";
            orderSub.expiresOn = sub.expiresOn || new Date(Date.now() + 86400000 * 30);
            orderSub.createdOn = new Date();
            let sub = subsSaved.find(sub => sub.name === orderSub.name)
            if (sub) {
                if (new Date(sub.expiresOn) > new Date()) {
                    orderSub.state = "inactive"
                }
                subsSaved.push(orderSub)
                continue;
            }
            // inactive any currently active sub that corresponds to sub in the newly paid-for subs 
            // that has expired but not yet set to inactive;
            subsSaved.forEach(element => {
                if ((element.name === orderSub.name) && element.id !== orderSub.id) {
                    element.state = "inactive";
                }
            });
            subsSaved.push(orderSub)
        }
        //console.log(JSON.stringify(updateOneArray,null,2) )
        let result2 = await subscriptionsCol.updateOne({ accountID: account.accountID }, {
            $set: { subs: subsSaved }
        });
        res.status(200);
        return res.json({
            info: `suscriptions made: ${subs.map(sub => sub.name).join(", ")}`
        });
    } catch (error) {
        console.log(error)
        res.status(500)
        res.json({ err: "Server error" })
    }

}

router.put("/pay", validateSubscriptionMW, mwPay);

router.put("/", validateSubscriptionMW, mwPay);

//user id, email or username
router.get("/", (req, res, next) => {
    console.log(req.headers["authorization"])
    let { id } = req.params;
    return res.json({ id })
});

module.exports = router;