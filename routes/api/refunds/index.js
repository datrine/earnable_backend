const router = require("express").Router();
const withdrawalsRouter = require("./withdrawals");
const refundsRouter = require("./refunds");
const walletsRouter = require("../wallets");
const transactionIDRouter = require("./[transactionID]");

router.get("/total_refunds",async(req,res,next)=>{
try {
  
} catch (error) {
  console.log(error);
}
})

module.exports = router;
