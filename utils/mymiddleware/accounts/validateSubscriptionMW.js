const { getAccountMW } = require(".");
const { mongoClient } = require("../../conn/mongoConn");
const { verifyToken } = require("../../encdec");
const { defaultCompanyAdminRoles, defaultCompanyActionRoles } = require("../../misc/shop_roles");
const { separateFreeFromPaid } = require("../../paymentServices/tiering/tiershop");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies");
const accountsCol = waleprjDB.collection("accounts");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let validateSubscriptionMW = async (req, res, next) => {
    try {
        res.status(400);
        let data = req.body;
        if (!data) {
            console.log("No request body")
            return res.json({ err: "No request body" })
        }
        if (!data.subs) {
            console.log("No subscriptions made")
            return res.json({ err: "No subscriptions made" })
        }

        if (!Array.isArray(data.subs)) {
            console.log("'subs' must be array")
            return res.json({ err: "'subs' property must be an array" })
        }

        if (data.subs.length < 1) {
            console.log("'subs' array cannot be empty")
            return res.json({ err: "'subs' array cannot be empty" })
        }

        for (const { name, tier } of data.subs) {
            if (!name) {
                console.log(`'Sub' name cannot be empty`)
                return res.json({ err: `'subs' name cannot be empty` })
            }
            if (!tier) {
                console.log(`No tier selected`)
                return res.json({ err: `No tier selected for ${name}` })
            }
        }
        let{freeSubs,paidSubs}= separateFreeFromPaid( data.subs);
        req.session.subObj={freeSubs,paidSubs}
        res.status(200)
        return next()
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};


module.exports = { validateSubscriptionMW };