const router = require("express").Router()
const { mongoClient } = require("../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const ordersCol = waleprjDB.collection("orders")
const { validateServerSidePaymentMW } = require("../../../utils/mymiddleware/accounts/validateServerSidePaymentMW");
const { createCompanyWallet, getWalletByCompanyID } = require("../../../db/wallet");

router.use(tokenVerifyMW);

router.post("/", async(req, res, next) => {
    try {
    let { companyID,walletID } = req.body;
    
    if (!companyID) {
       return res.json({err:{msg:"CompanyID Not supplied"}})
    }
    let company=getu
    if (!companyID) {
       return res.json({err:{msg:"CompanyID Not supplied"}})
    }
    } catch (error) {
        console.log(error)
    }
});

router.post("/", async(req, res, next) => {
    try {
    let { companyID,walletID } = req.body;
    
    if (companyID) {
       let walletRes=await createCompanyWallet({companyID,});
       console.log(walletRes);
       return res.json(walletRes)
    }
    } catch (error) {
        console.log(error)
    }
});


router.get("/:companyID", async(req, res, next) => {
    try {
    let { companyID,walletID } = req.params
    if (companyID) {
       let walletRes=await getWalletByCompanyID();
       console.log(walletRes);
       return res.json(walletRes)
    }
    } catch (error) {
        console.log(error)
    }
});


module.exports = router;