const router = require("express").Router();
const { mongoClient } = require("../../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const usersCol = waleprjDB.collection("users")
const { cleanAndValidateUser } = require("../../../../utils/validators/user");
const { getToken } = require("../../../../utils/encdec");
const bcrypt = require("bcrypt")
const {directMobilePinLoginFunc } = require("../../../../db/login");
const { retrieveVerSessIDByIdentifier } = require("../../../../db/account");


router.get("/retrieve", async (req, res, next) => {
    try {
        console.log(req.query)
        
        let retrieveRes = await retrieveVerSessIDByIdentifier(req.query);
        return res.json(retrieveRes);
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

module.exports = router;