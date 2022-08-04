const router = require("express").Router()
const { mongoClient, ObjectID } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees")
const $ = require("mongo-dot-notation");
const { getAccountMW } = require("../../../utils/mymiddleware/accounts");
const { canEditProductMW } = require("../../../utils/mymiddleware/products/canEditProductMW");
const { ObjectId } = require("bson");

router.put("/", tokenVerifyMW, getAccountMW, canEditProductMW, async (req, res, next) => {
    try {
        res.status(400);
        let user = req.user;
        let { productEdit } = req
        let { desc, name, brand, priceInfo, shopId, productId, _id, ...meta } = productEdit;
        let prodToUpdate = JSON.parse(JSON.stringify({ desc, name, priceInfo, brand, shopId, ...meta }))
        productEdit.shopId = ObjectId(productEdit.shopId);
        let result = await employeesCol.updateOne({
            _id: ObjectID(productEdit.productId)
        }, {
            $set: {
                ...prodToUpdate,
                lastModified: new Date()
            }
        })
        const session = mongoClient.startSession();

        if (!result) {
            console.log("Unable to save");
            throw "Unable to save"
        }
        res.status(200)
        return res.json({ info: "proof of concept" });
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
});

module.exports = router;