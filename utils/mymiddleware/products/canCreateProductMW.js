const { ObjectId } = require("bson");
const { mongoClient } = require("../../conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies");
const subscriptionCol = waleprjDB.collection("subscriptions");
const { cleanAndValidateNewProduct } = require("../../validators/products")

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let canAddEmployeeMW = async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account;
        let data = req.body;
        console.log(data)
        if (!data) {
            console.log("No employee details to save");
            return res.json({ err: "No employee detail to save" });
        }

        if (!data.companyID) {
            console.log("No companyID to associate with employee ");
            return res.json({ err: "No companyID to associate with employee" });
        }

        let refinedData = cleanAndValidateNewProduct(data);

        if (!ObjectId.isValid(refinedData.companyID)) {
            console.log("CompanyId not valid");
            return res.json({ err: "CompanyId not valid" });
        }

        let company = await companiesCol.findOne({
            _id: ObjectId(refinedData.companyID),
        });

        if (!company) {
            console.log("CompanyId not valid");
            return res.json({ err: "CompanyId not valid" });
        }

        let hasSaveRole = company.roles.find(role =>
            !!role.listOfUsers.find(userOnList =>
                role.name === "addEmployee" && userOnList.email === account.email));

        if (!hasSaveRole) {
            console.log("You are not authorized to create");
            return res.json({ err: "You are not authorized to create" });
        }

        let subData = await subscriptionCol.findOne({
            accountID: account.accountID,
            "subs.name": "company"
        });

        if (!subData) {
            console.log(`No active 'shop' subscription for account with username ${account.username}`)
            return res.json({ err: `No active 'shop' subscription for account with username ${account.username}` })
        }

        let currentCompanySub = subData.subs.find(sub => sub.name === "company");

        if (new Date() > currentCompanySub.expiresOn) {
            console.log("subscription has expired.")
            return res.json({ err: `subscription has expired.` });
        }
        req.employeeToSave = refinedData
        res.status(200)
        return next()
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};


module.exports = { canAddEmployeeMW };