const { ObjectId } = require("bson");
const { mongoClient } = require("../../conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies");
const employeesCol = waleprjDB.collection("employees");
const subscriptionCol = waleprjDB.collection("subscriptions");
const { cleanProductDataUpdate } = require("../../validators/products")

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let canEditProductMW = async (req, res, next) => {
    try {

        res.status(400)
        let account = req.session.account;
        let data = req.body;

        if (!data) {
            console.log("No employee details to save");
            return res.json({ err: "No employee detail to save" });
        }

        if (!data.companyID) {
            console.log("No companyID to associate with employee");
            return res.json({ err: "No companyID to associate with employee" });
        }

        if (!data.productId) {
            console.log("No productId to associate with employee");
            return res.json({ err: "No productId to associate with employee" });
        }

        if (!ObjectId.isValid(data.companyID)) {
            console.log("CompanyId not valid");
            return res.json({ err: "CompanyId not valid" });
        }

        let shop = await companiesCol.findOne({
            _id: ObjectId(data.companyID)
        });

        if (!shop) {
            console.log("CompanyId not valid");
            return res.json({ err: "CompanyId not valid" });
        }

        let hasSaveRole = shop.roles.find(role =>
            role.name === "editProduct" && !!role.listOfUsers.find(userOnList =>
                userOnList.email === account.email));

        if (!hasSaveRole) {
            console.log("You are not authorized to create");
            return res.json({ err: "You are not authorized to create" });
        }

        if (!ObjectId.isValid(data.productId)) {
            console.log("ProductId not valid");
            return res.json({ err: "ProductId not valid" });
        }

        let employee = await employeesCol.findOne({
            _id: ObjectId(data.productId)
        });

        if (!employee) {
            console.log("productId not valid");
            return res.json({ err: "ProductId not valid" });
        }

        if (data.priceInfo) {
            let priceInfo = data.priceInfo;
            if (!priceInfo.currency) {
                console.log("Currency set to NGN");
                priceInfo.currency = "NGN"
            }
            if (!priceInfo.priceObjs) {
                console.log("Price info format is wrong");
                return res.json({ err: "Wrong price info format..." })
            }
            for (const obj of priceInfo.priceObjs) {
                if (!obj.price) {
                    console.log("Price is not  is wrong");
                    return res.json({ err: "Wrong price format..." })
                }
                if (!isFinite(Number(obj.price))) {
                    console.log("Price must be a decimal");
                    return res.json({ err: "Price must be a decimal..." })
                }
                if (!obj.quantifier) {
                    console.log("Quantifier set to quantifier");
                    obj.quantifier = "unit"
                }
            }
        }

        let refinedData = cleanProductDataUpdate(data);

        let subData = await subscriptionCol.findOne({
            email: account.email,
            "subs.name": "shop"
        });

        if (!subData) {
            console.log(`No active 'shop' subscription for account with username ${account.username}`)
            return res.json({ err: `No active 'shop' subscription for account with username ${account.username}` })
        }

        let currentCompanySub = subData.subs.find(sub => sub.name === "shop");

        if (new Date() > currentCompanySub.expiresOn) {
            console.log("subscription has expired.")
            return res.json({ err: `subscription has expired.` });
        }

        req.productEdit = refinedData.data
        res.status(200)
        return next()
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};


module.exports = { canEditProductMW };