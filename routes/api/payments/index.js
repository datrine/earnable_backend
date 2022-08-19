const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const ordersCol = waleprjDB.collection("orders")
const { validateServerSidePaymentMW } = require("../../../utils/mymiddleware/accounts/validateServerSidePaymentMW");
// Require the library
let key=process.env.PAYSTACK_SECRET_KEY
var paystack = require("paystack-api")(key);

router.post("/webhook/paystack",async(req,res,next)=>{
    try {

    } catch (error) {
        console.log(error)
    }
});

router.post("/wallets", validateServerSidePaymentMW,);

router.post("/pay", validateServerSidePaymentMW,);


router.get("/", (req, res, next) => {
    let { paymentData } = req.body
    return res.json({ data: paymentData });
});


module.exports = router;