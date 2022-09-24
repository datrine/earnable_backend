const router = require("express").Router();
const { mongoClient } = require("../../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const ordersCol = waleprjDB.collection("orders");
const {
  validateServerSidePaymentMW,
} = require("../../../../utils/mymiddleware/accounts/validateServerSidePaymentMW");
const {
  createCompanyWallet,
  getWalletByCompanyID,
  getOrCreateCompanyWallet,
  fundWallet,
} = require("../../../../db/wallet");
const {
  createTransaction,
  updateTransactionByTransactionID,
} = require("../../../../db/transaction");
const { default: axios } = require("axios");
const fetch = require("isomorphic-unfetch");
const {
  hasRole,
  addUsersToRole,
  addUsersToRoles,
} = require("../../../../db/role");
const {
  retrieveAccountInfoBasic,
  updateAccVer,
  updateAccInfo,
  getUserInfo,
} = require("../../../../db/account");
const { createResource } = require("../../../../db/resource");
const { sendEmail } = require("../../../../from/utils/email_mgt");
let secret = process.env.PAYSTACK_SECRET_KEY;

router.post("/create", async (req, res, next) => {
  try {
    let { companyID, company, account } = req.session;
    console.log(req.body)
    let {
      email: toAddEmail,
      rolenames= [],
      role_title,
    } = req.body;
    let hasRoleRes = await hasRole({
      accountID: account.accountID,
      rolename: "addUserToRole",
    });
    if (!hasRoleRes) {
      return res.json({ err: { msg: "Has no privileges to create roles..." } });
    }
    let { account: toAddAcc, err: toAddErr } = await retrieveAccountInfoBasic({
      identifier: toAddEmail,
    });
    if (toAddErr) {
      return res.json({ err: toAddErr });
    }

    let addUsersRes = await addUsersToRoles({
      accountsRolesMap: [{ ...toAddAcc, rolenames }],
      companyID,
    });

    if (addUsersRes?.err) {
      return res.json(addUsersRes);
    }

    let createResourceRes = await createResource({
      accountID: toAddAcc.accountID,
      resourceDocID: companyID,
      resource_type: "company",
    });
    if (createResourceRes.err) {
      return res.json(createResourceRes);
    }
    res.json(createResourceRes);
    let updateAccRes = await updateAccInfo({
      accountID: toAddAcc.accountID,
      prop: "role_title",
      propValue: role_title,
    });
    console.log(updateAccRes);
    if (updateAccRes?.err) {
      return;
    }
    let userInfoRes = await getUserInfo({ accountID: toAddAcc.accountID });
    console.log(userInfoRes)
    if (userInfoRes?.err) {
      return;
    }
    let user = userInfoRes.user;
    sendEmail({
      to: toAddAcc.email,
      text: `<p>Hello, ${user.l_name} ${user.f_name}. 
    You have been added as a dashboard administrator of company ${company.company_name}. 
    Please click on this link to log in and access the dashboard</p>`,subject:"Admin Invite"
    })
      .then(console.log)
      .catch(console.log);
  } catch (error) {
    console.log(error);
  }
});

router.get("/wallet/:transactionID/", async (req, res, next) => {
  try {
    let { companyID, account } = req.session;
    let data = req.body;
  } catch (error) {
    console.log(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    let { companyID, walletID } = req.body;

    if (companyID) {
      let walletRes = await getOrCreateCompanyWallet({ companyID });
      console.log(walletRes);
      return res.json(walletRes);
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/:companyID", async (req, res, next) => {
  try {
    let { companyID, walletID } = req.params;
    if (companyID) {
      let walletRes = await getWalletByCompanyID();
      console.log(walletRes);
      return res.json(walletRes);
    }
  } catch (error) {
    console.log(error);
  }
});

let verifyPaystack = async (reference) => {
  try {
    let response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "get",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      }
    );
    let data = await response.json();
    return data;
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
      console.log("Error", error.message);
    }
    throw { err: error };
  }
};

module.exports = router;
