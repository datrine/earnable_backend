const router = require("express").Router();
const { json } = require("body-parser");
const loginRouter = require("./login");
const registerRouter = require("./register");
const { mongoClient } = require("../../../utils/conn/mongoConn");
const { verifyToken } = require("../../../utils/encdec");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const usersCol = waleprjDB.collection("users")
const { cleanAndValidateUser, cleanUserDataUpdate } = require("../../../utils/validators/user");
const { checkIfAccountPropExists } = require("../../../db/account");

//user id, email or username
router.get("/:id", (req, res, next) => {
    console.log(req.headers["authorization"])
    let { id } = req.params;
    return res.json({ id })
});

router.use("/login", loginRouter);

router.use("/register", registerRouter);

router.get("/", (req, res, next) => {
    return res.json([])
});


//user id, email or username
router.get("/checkifexists/:prop/:value", async (req, res, next) => {
    let { prop, value } = req.params;
    let { exists } = await checkIfAccountPropExists({ prop, value });
    console.log({exists})
    return res.json({ exists })
});

module.exports = router;