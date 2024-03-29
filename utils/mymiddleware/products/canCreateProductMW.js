const { ObjectId } = require("bson");
const { getResourceByResourceID } = require("../../../db/resource");
const { hasRole } = require("../../../db/role");
const { mongoClient } = require("../../conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const companiesCol = waleprjDB.collection("companies");
const subscriptionCol = waleprjDB.collection("subscriptions");
const { cleanAndValidateNewProduct } = require("../../validators/products");

/**
 *
 * @param {import("express").request} req
 * @param {import("express").Response} res
 * @param {function} next
 */
let canAddEmployeeMW = async (req, res, next) => {
  try {
    res.status(400);
    let account = req.session.account;
    let { accountID } = account;
    let data = req.body;
    if (!data) {
      console.log("No employee details to save");
      return res.json({ err: "No employee detail to save" });
    }

    if (!data.companyID) {
      console.log("No companyID to associate with employee ");
      return res.json({ err: "No companyID to associate with employee" });
    }

    let refinedData = cleanAndValidateNewProduct(data);
    console.log({ refinedData });
    if (!ObjectId.isValid(refinedData.companyID)) {
      console.log(`CompanyId ${refinedData?.companyID} not valid`);
      return res.json({ err: "CompanyId not valid" });
    }

    let company = await companiesCol.findOne({
      _id: ObjectId(refinedData.companyID),
    });

    if (!company) {
      console.log("CompanyId not valid");
      return res.json({ err: "CompanyId not valid" });
    }

    let { status } = company;
    if (!(status && status.name === "verified")) {
      console.log("Company no yet verified");
      return res.json({ err: { msg: "Company no yet verified" } });
    }

    let hasSaveRole = await hasRole({ accountID, rolename: "addEmployee" });

    if (!hasSaveRole) {
      console.log("You are not authorized to create");
      return res.json({ err: "You are not authorized to create" });
    }

    let resourceRes = await getResourceByResourceID({
      resourceDocID: company._id.toString(),
    });

    if (!resourceRes?.resource) {
      return res.json({ err: "Resource not found..." });
    }

    let { resource } = resourceRes;

    let subData = await subscriptionCol.findOne({
      accountID: resource.accountID,
      "subs.name": "company",
    });

    if (!subData) {
      console.log(
        `No active 'company' subscription for account with username ${account.username}`
      );
      return res.json({
        err: `No active 'company' subscription for account with username ${account.username}`,
      });
    }

    let currentCompanySub = subData.subs.find((sub) => sub.name === "company");

    if (new Date() > currentCompanySub.expiresOn) {
      console.log("subscription has expired.");
      return res.json({ err: `subscription has expired.` });
    }

    req.session.employeeToSave = refinedData;
    req.session.company = company;

    req.session.queried = {
      ...req.session.queried,
      monthly_salary: Number(req.session.queried.monthly_salary),
    };
    
    req.session.queried.employeeToSave = refinedData;
    req.session.queried.company = company;
    res.status(200);
    return next();
  } catch (error) {
    res.status(500);
    console.log(error);
    res.json({ err: error });
  }
};

module.exports = { canAddEmployeeMW };
