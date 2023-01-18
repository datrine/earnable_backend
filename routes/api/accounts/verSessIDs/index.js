const router = require("express").Router();
const bcrypt = require("bcrypt")
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