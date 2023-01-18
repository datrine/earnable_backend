const router = require("express").Router();
const { mongoClient } = require("../../../utils/conn/mongoConn");
const { verifySubscriptionMW } = require("../../../utils/mymiddleware/accounts/verifySubscriptionMW");
const {getSubscriptionsFromOrder } = require("../../../utils/quickGets/order");

const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const subscriptionsCol = waleprjDB.collection("subscriptions");


router.put("/pay", verifySubscriptionMW, async (req, res, next) => {
    try {
        res.status(400)
        let user = req.user;
        let { orderId } = req.body;
        let subsOrdered=   getSubscriptionsFromOrder({orderId})
        let updateOneArray=[]
        for (const sub of subsOrdered) {
            sub.isActive=true;
            const updateOne = {
                filter: {
                    email: user.email,
                    //"subs.name": { $eq: sub.name }
                },
                arrayFilters: [{ "sub.name": { $eq: sub.name } }],
                update: {
                    $set:
                    {
                        "subs.$[sub].lastModified": new Date(),
                        "subs.$[sub].isActive":sub.isActive||false,
                        "subs.$[sub].expiresOn":sub.expiresOn||new Date(Date.now()+86400000*30),
                    },
                    $setOnInsert: {
                        "subs.$[sub].tier": sub.tier,
                        "subs.$[sub].createdOn": new Date(),
                    }
                },
                upsert: true
            }
            updateOneArray.push({ updateOne })
        }
        //console.log(JSON.stringify(updateOneArray,null,2) )
        let result = await subscriptionsCol.bulkWrite([...updateOneArray,]);
        if (result.writeErrors) {
            console.console.log((JSON.stringify(result.writeErrors,null,2)));
            return res.json({
                info: `suscriptions failed: ${subs.map(sub => sub.name).join(", ")}`
            });
        }
        res.status(200);
        return res.json({
            info: `suscriptions made: ${subs.map(sub => sub.name).join(", ")}`
        });
    } catch (error) {
        console.log(error)
        res.status(500)
        res.json({ err: "Server error" })
    }

});

//user id, email or username
router.get("/", (req, res, next) => {
    console.log(req.headers["authorization"])
    let { id } = req.params;
    return res.json({ id })
});

module.exports = router;