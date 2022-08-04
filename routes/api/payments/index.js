const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const ordersCol = waleprjDB.collection("orders")
const { validateServerSidePaymentMW } = require("../../../utils/mymiddleware/accounts/validateServerSidePaymentMW");

router.use(tokenVerifyMW);

router.post("/pay", validateServerSidePaymentMW,);


router.get("/", (req, res, next) => {
    let { paymentData } = req.body
    return res.json({ data: paymentData });
});


module.exports = router;