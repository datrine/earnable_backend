const { mongoClient } = require("../../conn/mongoConn");
const {  getNumberOfAvailableCompanylimit } = require("../../paymentServices/tiering/tiershop");

const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const companiesCol = waleprjDB.collection("companies");
const subscriptionCol = waleprjDB.collection("subscriptions");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let canCreateCompanyMW = async (req, res, next) => {
    try {

        res.status(400)
        let account = req.session.account;
        let subData = await subscriptionCol.findOne({
            accountID: account.accountID,
            "subs.name": "company"
        });

        if (!subData) {
            console.log(`No active 'company' subscription for user ${account.username}`)
            return res.json({ err:{msg: `No active 'company' subscription for user ${account.username}`} })
        }
        let currentCompanySub = subData.subs.find(sub => sub.name === "company");
        if (new Date() > currentCompanySub.expiresOn) {
            console.log("subscription has expired.")
            return res.json({ err: {msg:`subscription has expired.`} });
        }
        let tierCompanyLimit = getNumberOfAvailableCompanylimit(currentCompanySub.tier);

        let currentNumberOfCompany = await companiesCol.countDocuments({
            "creatorMeta.accountID":account. accountID,
        });

        if (tierCompanyLimit <= currentNumberOfCompany) {
            console.log("Client has reached the limit of companies creatable in current tier.")
            return res.json({
                err:
                   {msg: `Client has reached the limit of companies creatable in current tier.`}
            });
        }

        res.status(200)
        return next()
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};


module.exports = { canCreateCompanyMW };