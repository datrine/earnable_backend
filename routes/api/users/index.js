const router = require("express").Router();
const { json } = require("body-parser");
const { mongoClient } = require("../../../utils/conn/mongoConn");
const { verifyToken } = require("../../../utils/encdec");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const usersCol = waleprjDB.collection("users")
const { cleanAndValidateUser, cleanUserDataUpdate } = require("../../../utils/validators/user");

//user id, email or username
router.get("/:id", (req, res, next) => {
    console.log(req.headers["authorization"])
    let { id } = req.params;
    return res.json({ id })
});

router.get("/", (req, res, next) => {
    return res.json([])
});

module.exports = router;