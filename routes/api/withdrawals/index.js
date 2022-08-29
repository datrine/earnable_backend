const router = require("express").Router();
const { validateServerSidePaymentMW } = require("../../../utils/mymiddleware/accounts/validateServerSidePaymentMW");
const { createCompanyWallet, getWalletByCompanyID } = require("../../../db/wallet");
const { getEmployeeWithdrawalHistory } = require("../../../db/withdrawal");
const { getEmployeeByAccountID } = require("../../../db/employee");

router.get("/", async(req, res, next) => {
    try {
    let { companyID,account } = req.session;
    let filters = req.query;
    let withdrawalHistoryRes= await getEmployeeWithdrawalHistory({employeeID,filters});
    res.json(withdrawalHistoryRes);
    } catch (error) {
        console.log(error)
    }
});

router.post("/fund", async(req, res, next) => {
    try {
    let { companyID,account } = req.session;
    let data=req.body
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


router.get("/:withdrawalID", async(req, res, next) => {
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