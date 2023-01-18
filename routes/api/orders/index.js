const router = require("express").Router()
const { mongoClient, ObjectID } = require("../../../utils/conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const productOrderRouter = require("./product");
const ordersCol = waleprjDB.collection("orders");
const sessIDVerifyMW = require("../../../utils/mymiddleware/sessIDVerifyMW");

router.use(sessIDVerifyMW, productOrderRouter)

router.put("/:id", async (req, res, next) => {
    try {
        res.status(400)
        let user = req.user
        let { id: orderId } = req.params;
        let { items } = req.body;
        if (!orderId) {
            return res.json({ err: "Order id not sent" })
        }
        if (!ObjectID.isValid(orderId)) {
            return res.json({ err: "Order id not valid" })
        }
        if (!items) {
            console.log("Items must be set");
            return res.json({ err: "Items must be set" })
        }
        if (!Array.isArray(items)) {
            console.log("Items cannot be empty");
            return res.json({ err: "items cannot be empty" })
        }



        let savedOrder = await ordersCol.findOne({
            _id: ObjectID(orderId),
            email: user.email
        });
if (!savedOrder) {
    return res.json({err:"No order that matches id"})
}
        const session = mongoClient.startSession();
        try {
            await session.withTransaction(async () => {
                let updateOneArray = []
                for (const item of items) {
                    const updateOne = {
                        filter: {
                            _id: ObjectID(orderId),
                            email: user.email,
                        },
                        arrayFilters: [{ "item.id": { $eq: item.id } }],
                        update: {
                            $addToSet:
                                { "items.$[item]": item },
                            $set: { lastModified: new Date() }
                        },
                        upsert: true
                    }
                    updateOneArray.push({ updateOne })
                }
                //console.log(JSON.stringify(updateOneArray,null,2) )
                let result = await ordersCol.bulkWrite([...updateOneArray,], { session });
                console.log(result)
            });
            //await session.endSession();
        } catch (error) {
            console.log("failed...");
            console.log(error)
            return res.json({ err: error });
        } finally {
            // await session.endSession();
        }


        return res.json({ info: "Updates saved." })
    } catch (error) {
        console.log(error);
        res.status(500);
        return res.json({ err: "Server error" })
    }

});

router.get("/:id", async (req, res, next) => {
    try {
        res.status(400)
        let user = req.user
        console.log(user)
        let { id: orderId } = req.params;
        if (!orderId) {
            return res.json({ err: "Order id not sent" })
        }
        if (!ObjectID.isValid(orderId)) {
            return res.json({ err: "Order id not valid" })
        }
        let order = await ordersCol.findOne({
            _id: ObjectID(orderId),
            email: user.email
        });
        if (!order) {
            console.log("No order found");
            res.status(404)
            return res.json({ err: "Order not found" })
        }
        return res.json({ order })
    } catch (error) {
        console.log(error);
        res.status(500);
        return res.json({ err: "Server error" })
    }

});

module.exports = router;