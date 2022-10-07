const router = require("express").Router();
const companyIDRouter = require("./[companyID]");
const createCompanyApiRouter = require("./company_new");
const {
  getAuthAccount,
} = require("../../../from/utils/middlewares/getAuthAccount");
const { getCompaniesByIDs, getCompanyByID } = require("../../../db/company");
const { getResourcesByAccID } = require("../../../db/resource");

router.use("/", getAuthAccount);

router.use("/create", createCompanyApiRouter);

router.use(
  "/:companyID",
  async (req, res, next) => {
    try {
      let { companyID } = req.params;
      let companyRes = await getCompanyByID({ id: companyID });
      if (companyRes?.err) {
        return res.json(companyRes);
      }
      req.session.queried = { ...req.session.queried };
      req.session.queried.company = companyRes.company;
      req.session.queried.companyID = companyID;
      next();
    } catch (error) {
      console.log(error);
      res.json({ err: error });
    }
  },
  companyIDRouter
);

router.get("/list", async (req, res, next) => {
  let { accountID } = req.session.account;
  let resourcesRes = await getResourcesByAccID({
    accountID,
    filterIn: ["company"],
  });

  let companiesRes = await getCompaniesByIDs({
    ids: [...resourcesRes.resources].map((resource) => resource.resourceDocID),
  });
  console.log("companiesRes");
  return res.json(companiesRes);
});

module.exports = router;
