const router = require("express").Router();
const { mongoClient } = require("../../../../utils/conn/mongoConn");
const { validateSubscriptionMW } = require("../../../../utils/mymiddleware/accounts/validateSubscriptionMW");
const { createOrder, createSubsOrderItems } = require("../../../../utils/paymentServices/orders/create_orders");
const { separateFreeFromPaid } = require("../../../../utils/paymentServices/tiering/tiershop");
const waleprjDB = mongoClient.db("waleprj");
const subscriptionsCol = waleprjDB.collection("subscriptions");

const subscriptionsPaymentRouter = require("./pay_sub");

router.use("/pay", subscriptionsPaymentRouter)

router.put("/add", validateSubscriptionMW, async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account;
        let { subs } = req.body;
        let { freeSubs, paidSubs } = req.session.subObj
        if (paidSubs.length > 0) {
            let preOrder = createSubsOrderItems(paidSubs);
            preOrder.email = account.email
            preOrder.accountID = account.accountID
            let order = await createOrder(preOrder);
        }

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
        if (!result.ok) {
            return res.json({ err: { msg: "No subscription data" } })
        }
        let { subs: subsSaved = [] } = subscription || {};
        for (const freeSub of freeSubs) {
            freeSub.state = "active";
            let sub = subsSaved.find(sub => sub.name === freeSub.name);
            if (sub) {
                if (new Date(sub.expiresOn) > new Date()) {
                    // dont add since a current free sub is active
                    continue;
                }
            }
            subsSaved.forEach(element => {
                if (element.name === freeSub.name) {
                    element.state = "inactive";
                }

            });
            subsSaved.push(freeSub)
        }
        let result2 = await subscriptionsCol.updateOne({ accountID: account.accountID }, {
            $set: { subs: subsSaved }
        })
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

router.get("/:name/active", async (req, res, next) => {
    try {
        res.status(400)
        let { name } = req.params
        let account = req.session.account;
        let subscription = await subscriptionsCol.findOne({
            accountID: account.accountID
        });
        let subs = subscription.subs.filter(obj => (obj.name === name && obj.state === "active" && (new Date() < new Date(obj.expiresOn))))

        console.log(name)
        res.status(200);

        return res.json({
            sub:subs[0]
        });
    } catch (error) {

    }
});

router.get("/", async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account;
        let subscription = await subscriptionsCol.findOne({
            accountID: account.accountID
        });
        let subs = subscription.subs
        res.status(200);

        return res.json({
            subs
        });
    } catch (error) {

    }
});

//user id, email or username
router.get("/", (req, res, next) => {
    console.log(req.headers["authorization"])
    let { id } = req.params;
    return res.json({ id })
});

module.exports = router;