const router = require("express").Router();
const {
  createCompanySettings,
  getCompanySettings,
} = require("../../../db/company");

//user id, email or username

router.post("/", async (req, res, next) => {
  try {
    let { companyID,  } = req.session.queried;
    let { account:selfAccount } = req.session.self;
    let { settings } = req.body;
    if (!settings && !Array.isArray(settings)) {
      return res.json({ err: { msg: "No settings" } });
    }
    for (const {name,value} of settings) {
        if (!name) {
            return res.json({ err: { msg: "No name for setting" } });
        }
        if (!value) {
            return res.json({ err: { msg: `No value for setting '${name}'` } });
        }
    }
    let createCompanySettingsRes = await createCompanySettings({
      companyID,
      settings,
      creatorAccountID: selfAccount.accountID,
    });
    console.log(createCompanySettingsRes);
    res.json(createCompanySettingsRes);
  } catch (error) {
    console.log(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    let { companyID } = req.session.queried;
    let getCompanySettingsRes = await getCompanySettings({ companyID });
    console.log(getCompanySettingsRes);
    res.json(getCompanySettingsRes);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
