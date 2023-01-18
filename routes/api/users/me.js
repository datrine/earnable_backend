const router = require("express").Router();
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const usersCol = waleprjDB.collection("users")
const {  cleanUserDataUpdate } = require("../../../utils/validators/user");
const _ = require("lodash")
const $ = require("mongo-dot-notation")

router.use(tokenVerifyMW)

router.put("/update", async (req, res, next) => {
    try {
        let user = req.user;
        res.status(400)
        let sanResponse = cleanUserDataUpdate(req.body)
        let { data: userToUpdate, reporting, format } = sanResponse
        if (!userToUpdate) {
            return res.json({ warning: sanResponse.format() })
        }
        let mongoData = $.flatten(userToUpdate)
        let result = await
            usersCol.updateOne({ email: user.email }, mongoData)
        if (!result.result.ok) {
            return res.json({ info: "Update was not successful" })
        }
        res.status(200)
        return res.json({ info: "ok" })
    } catch (error) {
        console.log(error)
        res.status(500);
        res.json({ err: "Server error" })
    }

});

router.get("/", (req, res, next) => {
    try {

        return res.json({ user: req.user })
    } catch (error) {
        console.log(error)
        res.json({ err: "Some error" })
    }
});

//user id, email or username
router.get("/:id", (req, res, next) => {
    let { id } = req.params;
    return res.json({ id })
});

router.get("/", (req, res, next) => {
    return res.json([])
});

module.exports = router;