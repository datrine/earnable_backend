const router = require("express").Router();
const { mongoClient } = require("../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const usersCol = waleprjDB.collection("users")
const { cleanAndValidateUser } = require("../../../utils/validators/user");
const emailVerifyRouter = require("./verify");

router.use("/verify", emailVerifyRouter);

router.get("/", (req, res, next) => {
    return res.json([])
});


module.exports = router;