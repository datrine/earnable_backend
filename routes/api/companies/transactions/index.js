const router = require("express").Router()
const { getWalletByCompanyID, getOrCreateCompanyWallet, fundWallet } = require("../../../../db/wallet");
const { createTransaction, updateTransactionByID } = require("../../../../db/transaction");
const fetch = require("isomorphic-unfetch")
let secret = process.env.PAYSTACK_SECRET_KEY

router.post("/wallet/fund/save", async (req, res, next) => {
    try {
        let { companyID, account } = req.session;
        let data = req.body
        let dataToSave={...data}
        dataToSave.type = "wallet_fund"
        dataToSave.status={name:"initiated",updatedBy:account.accountID,updatedAt:new Date()}
        let { err, transactionID } = await createTransaction({ ...data });
        if (err) {
            return res.json({ err })
        }
        res.json({ transactionID });
        if (data.status === "success") {
            let { status, platform } = data;
            if (platform === "paystack") {
                let reference = data?.meta?.reference
                console.log(reference)
                let dataFromPaystack = await verifyPaystack(reference);
                if (dataFromPaystack?.data?.status === "success") {
                    //let {walletID}= await getOrCreateCompanyWallet({companyID,creatorMeta:{id:account.accountID}})
                    let { err, info } = await fundWallet({
                        companyID,
                        amount: Number(dataFromPaystack?.data?.amount) / 100,
                        createorMeta: { id: account.accountID }
                    });
                    updateTransactionByID({ transactionID, updates:{status: "completed",accountIDofUpdater:account.accountID }})
                    console.log(info)
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
});

router.get("/wallet/:transactionID/", async (req, res, next) => {
    try {
        let { companyID, account } = req.session;
        let data = req.body
    } catch (error) {
        console.log(error)
    }
});

router.post("/", async (req, res, next) => {
    try {
        let { companyID, walletID } = req.body;

        if (companyID) {
            let walletRes = await getOrCreateCompanyWallet({ companyID, });
            console.log(walletRes);
            return res.json(walletRes)
        }
    } catch (error) {
        console.log(error)
    }
});


router.get("/:companyID", async (req, res, next) => {
    try {
        let { companyID, walletID } = req.params
        if (companyID) {
            let walletRes = await getWalletByCompanyID();
            console.log(walletRes);
            return res.json(walletRes)
        }
    } catch (error) {
        console.log(error)
    }
});

let verifyPaystack = async (reference) => {
    try {
        let response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: "get",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${secret}`
            }
        });
        let data = await response.json()
        return data
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
        }
        throw { err: error }
    }
}

module.exports = router;