const router = require("express").Router();
const { mongoClient } = require("../../../utils/conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const companiesCol = waleprjDB.collection("companies");
const { setDefaultRoles } = require("../../../utils/misc/company_roles");
const {
  canCreateCompanyMW,
} = require("../../../utils/mymiddleware/accounts/canCreateShopMW");
const { ObjectId } = require("bson");
const sessIDVerifyMW = require("../../../utils/mymiddleware/sessIDVerifyMW");
const { createCompany } = require("../../../db/company");
const { createInitialCompanyRoles } = require("../../../db/role");
const { createResource } = require("../../../db/resource");
const { getOrCreateCompanyWallet } = require("../../../db/wallet");
const { company: companyTemplate } = require("../../../utils/templates");
const { DateTime } = require("luxon");

router.post("/", sessIDVerifyMW, canCreateCompanyMW, async (req, res, next) => {
  try {
    res.status(400);
    let account = req.session.account;
    /**
     * @type {companyTemplate}
     */
    let preCompanyData = req.body;

    if (!preCompanyData.company_name) {
      return res.json({ err: { msg: "No company name supplied" } });
    }

    if (!preCompanyData?.flexible_access?.access_mode) {
      return res.json({
        err: { msg: "No company flexible access mode supplied" },
      });
    }

    if (!preCompanyData.flexible_access?.value) {
      return res.json({
        err: { msg: "No company flexible access value supplied" },
      });
    }

    if (!preCompanyData.rc_number) {
      return res.json({ err: { msg: "No company rc number supplied" } });
    }

    let salary_date = preCompanyData.salary_date;
    let dateOf = DateTime.fromObject({ day: salary_date });
    let next_salary_date = DateTime.fromObject({ day: salary_date });
    if (DateTime.now() > dateOf) {
      next_salary_date = next_salary_date.plus({ month: 1 });
    }
    let salaryMonthID = next_salary_date.month;
    let salaryYearID = next_salary_date.year;
    preCompanyData.next_salary_date = next_salary_date;
    preCompanyData.salaryMonthID = salaryMonthID;
    preCompanyData.salaryYearID = salaryYearID;
    preCompanyData.status = { name: "unverified", createdOn: new Date() };
    preCompanyData.creatorMeta = {
      _id: ObjectId(account._id),
      accountID: account.accountID,
    };
    let roles = setDefaultRoles({ account });

    let companyRes = await createCompany({ ...preCompanyData });
    if (companyRes.err) {
      return res.json(companyRes);
    }
    let { companyID } = companyRes;
    let rolesRes = await createInitialCompanyRoles({
      roles,
      companyID,
      creatorMeta: { accountID: account.accountID },
    });
    if (rolesRes.err) {
      return res.json(rolesRes.err);
    }
    let resourceRes = await createResource({
      accountID: account.accountID,
      resource_type: "company",
      resourceDocID: companyID,
    });
    if (resourceRes.err) {
      return res.json(resourceRes.err);
    }
    let walletRes = await getOrCreateCompanyWallet({ companyID });
    if (walletRes.err) {
      return res.json(walletRes.err);
    }
    console.log({
      companyID: companyID,
      rolesID: rolesRes.rolesID,
      resourceID: resourceRes.resourceID,
      walletID: walletRes.walletID,
    });
    res.status(201);
    return res.json({
      companyID: companyRes.companyID,
      rolesID: rolesRes.rolesID,
      resourceID: resourceRes.resourceID,
      walletID: walletRes.walletID,
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    res.json({ err: error });
  }
});

router.get("/my_list", sessIDVerifyMW, async (req, res, next) => {
  try {
    res.status(400);
    let account = req.session.account;
    let filter = req.query;
    let { skip = 0, limit = 5, ...rest } = filter;
    let cursor = await companiesCol.find(
      {
        "creatorMeta.accountID": account.accountID,
        ...filter,
      },
      { skip, limit }
    );
    let shops = (await cursor.toArray()) || [];
    res.status(200);
    return res.json({ shops });
  } catch (error) {
    res.status(500);
    console.log(error);
    res.json({ err: error });
  }
});

module.exports = router;
