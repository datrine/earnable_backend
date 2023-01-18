
/**
 * @type {import("ng-banks").default}
 */
const { getCompanyByID } = require("../../db/company");
const {  accTemplate } = require("../../db/templates");
const { retrieveAccountInfoByAccountID } = require("../../db/account");

/**
 *
 * @param {import("express").request} req
 * @param {import("express").Response} res
 * @param {function} next
 */
let canRefundMW = async (req, res, next) => {
  try {
    let { amount, companyID } = req.session.queried;
    console.log({amount})
    if (!amount) {
      return res.json({ err: { msg: "Amount to refund must be included." } });
    }
    if (!companyID) {
      return res.json({ err: { msg: "companyID must be included." } });
    }
    amount = Number(amount) && Number(Number( amount).toFixed(2));
    if (Number.isNaN(amount)) {
      return res.json({
        err: {
          msg: "Amount to withdraw must be a valid amount in naira.kobo.",
        },
      });
    }
    req.session.queried.amount = amount;

    /**
     * @type {{account:accTemplate}}
     */
    let { account: authAccount, accountID: authAccountID } =
      req.session.self;
    if (!authAccount && !authAccountID) {
      return res.json({ err: { msg: "No accountID supplied." } });
    }
    if (!authAccount) {
      let retrieveRes = await retrieveAccountInfoByAccountID(authAccountID);
      if (retrieveRes.err) {
        return res.json(retrieveRes);
      }
      authAccount = retrieveRes.account;
      authAccountID = authAccount.accountID;
    }
    if (!authAccount?.activity?.current?.name === "active") {
      return res.json({ err: { msg: "Account yet active." } });
    }

    let promises = Promise.allSettled([
      getCompanyByID({ id: companyID }),
    ]);
    let [companyResult] = await promises;
    for await (const promise of [companyResult]) {
      if (promise.status === "rejected") {
        return res.json({ err: { msg: "" } });
      }
      if (promise.err) {
        return res.json(promise.err);
      }
      if (promise.value.company) {
        company = promise.value.company;
      }
    }
    let queried = {};
    queried.account = authAccount;
    queried.company = company;
    req.session.queried = { ...req.session.queried, ...queried };
    next();
  } catch (error) {
    console.log(error);
    return res.json({ err: error });
  }
};

module.exports = { canRefundMW };
