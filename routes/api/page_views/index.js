const router = require("express").Router()
const { mongoClient, ObjectID } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const employeeViewRouter = require("./employee");

router.use("/", async (req, res, next) => {
    next()
});

router.use("/employee", employeeViewRouter);
module.exports = router;