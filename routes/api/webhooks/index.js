const router = require("express").Router();
const paystackRouter = require("./paystack");



router.use("/paystack", paystackRouter);

module.exports = router;