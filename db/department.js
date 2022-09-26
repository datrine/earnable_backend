const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const departmentsCol = waleprjDB.collection("departments");
const { ObjectId, UUID } = require("bson");
const { nanoid } = require("nanoid");

let createDepartment = async ({ companyID, ...deptToData }) => {
  try {
    let result1 = await departmentsCol.insertOne({
      companyID,
      ...deptToData,
      lastModified: new Date(),
      createdOn: new Date(),
    });
    if (!result1.insertedId) {
      return { err: { msg: "Unable to create department..." } };
    }
    return { departmentID: result1.insertedId.toString() };
  } catch (error) {
    res.status(500);
    console.log(error);
    res.json({ err: error });
  }
};

let getDepartmentsByCompanyID = async ({ companyID, filters }) => {
  try {
    let departmentsCursor;
    let filterBuilder = null;

    if (filters.enrolled) {
      if (!filterBuilder) {
        filterBuilder = {};
      }
      filterBuilder.enrolled = true;
    }

    if (filters.dept_name) {
      if (!filterBuilder) {
        filterBuilder = {};
      }
      filterBuilder["dept_name"] = { $eq: filters.dept_name };
    }

    if (filters.unenrolled) {
      if (!filterBuilder) {
        filterBuilder = {};
      }
      filterBuilder.enrolled = { $ne: true };
    }
    console.log(filterBuilder);

    departmentsCursor = await departmentsCol.find({
      $or: [{ companyID }, { companyID: ObjectId(companyID) }],
      ...filterBuilder,
    });
    let departments = await departmentsCursor.toArray();
    departments = departments.map((department) => ({
      ...department,
      departmentID: department._id,
    }));
    return { departments };
  } catch (error) {
    console.log({ err: error });
    throw { err: error };
  }
};

let getDepartmentByDepartmentID = async ({ departmentID }) => {
  try {
    let departmentDoc = await departmentsCol.findOne({
      _id: ObjectId(departmentID),
    });
    if (!departmentDoc) {
      return { err: { msg: "Department not found" } };
    }
    return { department: { ...departmentDoc, departmentID } };
  } catch (error) {
    console.log({ err: error });
    throw error;
  }
};


let editDepartment = async ({
  companyID,
  departmentID,
  dept_policies,
  ...deptToData
}) => {
  try {
    console.log(dept_policies);
    let result1 = await departmentsCol.findOneAndUpdate(
      { _id: ObjectId(departmentID) },
      [
        {
          $set: {
            ...deptToData,
            dept_policies: {
              $cond: {
                if: { $isArray: [dept_policies] },
                then: {
                  $concatArrays: [
                    {
                      $ifNull: ["$dept_policies", []],
                    },
                    dept_policies,
                  ],
                },
                //then: 60,
                else: { $ifNull: ["$dept_policies", []] },
                //else:80
              },
            },
            lastModified: {
              $cond: {
                if: deptToData,
                then: new Date(),
                else: "$lastModified",
              },
            },
          },
        },
      ],
      { returnDocument: "after" }
    );
    if (!result1.ok) {
      return { err: { msg: "Unable to edit department..." } };
    }
    return { saved: true, editLabel: nanoid() };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let getDeptPolicies = async ({
    companyID,
    departmentID,
    filters,
    ...deptToData
  }) => {
    try {
      console.log(dept_policies);
      let result1 = await departmentsCol.findOneAndUpdate(
        { _id: ObjectId(departmentID) },
        [
          {
            $set: {
              ...deptToData,
              dept_policies: {
                $cond: {
                  if: { $isArray: [dept_policies] },
                  then: {
                    $concatArrays: [
                      {
                        $ifNull: ["$dept_policies", []],
                      },
                      dept_policies,
                    ],
                  },
                  //then: 60,
                  else: { $ifNull: ["$dept_policies", []] },
                  //else:80
                },
              },
              lastModified: {
                $cond: {
                  if: deptToData,
                  then: new Date(),
                  else: "$lastModified",
                },
              },
            },
          },
        ],
        { returnDocument: "after" }
      );
      if (!result1.ok) {
        return { err: { msg: "Unable to edit department..." } };
      }
      return { saved: true, editLabel: nanoid() };
    } catch (error) {
      console.log(error);
      return { err: error };
    }
  };

module.exports = {
  createDepartment,
  editDepartment,
  getDepartmentByDepartmentID,
  getDepartmentsByCompanyID,
};
