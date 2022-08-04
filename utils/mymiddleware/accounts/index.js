const { mongoClient } = require("../../conn/mongoConn");
const { createAccount } = require("../../dbmethods/account_methods");
const { verifyToken } = require("../../encdec");
const waleprjDB = mongoClient.db("waleprj");
const accountsCol = waleprjDB.collection("accounts");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let getAccountMW = async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account;
        let resultSearchForUserAccount = await createAccount(account);
        if (!resultSearchForUserAccount) {
            console.log("No user account for any services");
            return res.json({ err: "No user account for any services" })
        }
        res.status(200);
        req.accountId=resultSearchForUserAccount._id
        return next()
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};


module.exports = { getAccountMW };