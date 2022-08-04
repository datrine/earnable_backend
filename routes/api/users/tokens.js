const router = require("express").Router();
const { json } = require("body-parser");
const { mongoClient } = require("../../../utils/conn/mongoConn");
const { verifyToken } = require("../../../utils/encdec");
const sessIDVerifyMW = require("../../../utils/mymiddleware/sessIDVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const usersCol = waleprjDB.collection("users")
const { cleanAndValidateUser } = require("../../../utils/validators/user");

router.get("/me",sessIDVerifyMW, (req, res, next) => {
    try {
        res.json({account:req.session.account})
    } catch (error) {
        console.log(error)
        res.json({ err: "Some error" })
    }
});



//user id, email or username
router.get("/refresh", (req, res, next) => {
    let { id } = req.params;
    return res.json({ id })
});

router.post("/:id", (req, res, next) => {
    let { id } = req.params;
    console.log(id)
    return res.json({})
});

router.get("/", (req, res, next) => {
    return res.json([])
});

module.exports = router;