
const { mongoClient } = require("../utils/conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const companiesCol = waleprjDB.collection("companies");
const { ObjectId } = require("bson");
const { cleanAndValidateNewCompany } = require("../utils/validators/companies");
const { DateTime } = require("luxon");

let createCompany = async ({ ...companyDataToCreate }) => {
  try {
    let companyData = cleanAndValidateNewCompany(companyDataToCreate);
    let result1 = await companiesCol.insertOne({
      ...companyData,
      lastModified: new Date(),
      createdOn: new Date(),
    });
    if (!result1.insertedId) {
      return { err: { msg: "Unable to create" } };
    }
    return { companyID: result1.insertedId.toString() };
  } catch (error) {
    res.status(500);
    console.log(error);
    res.json({ err: error });
  }
};

let getCompaniesByIDs = async ({ ids }) => {
  try {
    let companiesCursor = await companiesCol.find({
      _id: { $in: [...ids].map((id) => ObjectId(id)) },
    });
    let companies = await companiesCursor.toArray();
    companies = companies.map((com) => ({
      ...com,
      companyID: com._id.toString(),
    }));
    return { companies };
  } catch (error) {
    console.log(error);
  }
};

let getCompanyByID = async ({ id }) => {
  try {
    let companyDoc = await companiesCol.findOne({ _id: ObjectId(id) });
    if (!companyDoc) {
      return { err: { msg: "Company not found" } };
    }

    return { company: { ...companyDoc, companyID: companyDoc._id.toString() } };
  } catch (error) {
    console.log(error);
  }
};

let getCompanySettings = async ({ companyID }) => {
  try {
    let companyDoc = await companiesCol.findOne({ _id: ObjectId(companyID) });
    if (!companyDoc) {
      return { err: { msg: "Company not found" } };
    }

    return { company_settings: companyDoc.settings };
  } catch (error) {
    console.log(error);
  }
};

let createCompanySettings = async ({
  companyID,
  settings = [],
  creatorAccountID,
}) => {
  let pipeline = [];
  console.log({ settings, companyID });
  for (const { name, value } of settings) {
    let settingPipeline = [
      {
        $set: {
          tempSetting: {
            $cond: {
              if: { $in: [name, { $ifNull: ["$settings.name", []] }] },
              then: {
                $first: {
                  $filter: {
                    input: "$settings",
                    cond: { $eq: ["$$setting.name", name] },
                    as: "setting",
                  },
                },
              },
              else: "$tempSetting",
            },
          },
          settings: {
            $cond: {
              if: { $in: [name, { $ifNull: ["$settings.name", []] }] },
              then: {
                $concatArrays: [
                  {
                    $ifNull: [
                      {
                        $filter: {
                          input: "$settings",
                          cond: { $ne: ["$$setting.name", name] },
                          as: "setting",
                        },
                      },
                      [],
                    ],
                  },
                  [{ name, value, creatorAccountID, updatedAt: new Date() }],
                ],
              },
              else: {
                $concatArrays: [
                  { $ifNull: ["$settings", []] },
                  [{ name, value, creatorAccountID, updatedAt: new Date() }],
                ],
              },
            },
          },
        },
      },
      {
        $set: {
          settings_history: {
            $cond: {
              if: "$tempSetting",
              then: {
                $concatArrays: [
                  { $ifNull: ["$settings_history", []] },
                  ["$tempSetting"],
                ],
              },
              else: { $ifNull: ["$settings_history", []] },
            },
          },
        },
      },
      { $set: { tempSetting: null } },
    ];
    pipeline.push(...settingPipeline);
  }
  try {
    let result = await companiesCol.findOneAndUpdate(
      { _id: ObjectId(companyID) },
      pipeline
    );
    if (!result.ok) {
      return { err: { msg: "Company setiings not changed" } };
    }

    return { info: "Settings changes made..." };
  } catch (error) {
    console.log(error);
  }
};

let setCompanySalaryDate = async ({ companyID, salary_date }) => {
  try {
    let dateOf = DateTime.fromObject({ day: salary_date });
    let next_salary_date = DateTime.fromObject({ day: salary_date });
    if (DateTime.now() > dateOf) {
      next_salary_date = next_salary_date.plus({ month: 1 });
    }
    let salaryMonthID = next_salary_date.month;
    let salaryYearID = next_salary_date.year;
    let companyDoc = await companiesCol.findOneAndUpdate(
      { _id: ObjectId(companyID) },
      [
        {
          $set: {
            salary_date,
            next_salary_date,
            salaryMonthID,
            salaryYearID,
            lastModified: new Date(),
          },
        },
        //{ $set: { salary_date } },
      ]
    );
    if (!companyDoc) {
      return { err: { msg: "Company not found" } };
    }

    return {
      info: "Salary date changed. Changes would reflect next salary cycle...",
      next_salary_date,
    };
  } catch (error) {
    console.log(error);
  }
};

let checkCompanyStatus = async ({ companyID }) => {
  try {
    let companyDoc = await companiesCol.findOne({ _id: ObjectId(companyID) });
    if (!companyDoc) {
      return { err: { msg: "Company not found" } };
    }
    let status = companyDoc.status;
    return {
      status,
    };
  } catch (error) {
    console.log(error);
  }
};

let verifyCompanyRCNumber = async ({ companyID, rc_number, company_name }) => {
  try {
    if (1 !== 2) {
      return;
    }
    let companyDoc = await companiesCol.findOne({ _id: ObjectId(companyID) });
    if (!companyDoc) {
      return { err: { msg: "Company not found" } };
    }
    let status = companyDoc.status;
    return {
      status,
    };
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  createCompany,
  getCompaniesByIDs,
  getCompanyByID,
  getCompanySettings,
  createCompanySettings,
  setCompanySalaryDate,
  checkCompanyStatus,
};
