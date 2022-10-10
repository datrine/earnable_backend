const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let composeGetEmployeesDetailsAgg = ({
  companyID,
  deptID,
  employeeID,
  from,
  to,
  enrollment_state,
  year = DateTime.now().year,
  weekNumber,
  accountID,
  monthNumber = DateTime.now().month,
}) => {
  from = !!from
    ? DateTime.isDateTime(DateTime.fromISO(from))
      ? new Date(from)
      : null
    : null;
  to = !!to
    ? DateTime.isDateTime(DateTime.fromISO(to))
      ? new Date(to)
      : null
    : null;
  let agg = [
    {
      $match: {
        $and: [
          {
            $expr: {
              $eq: [
                "$_id",
                {
                  $ifNull: [
                    ObjectId.isValid(employeeID) ? ObjectId(employeeID) : null,
                    "$_id",
                  ],
                },
              ],
            },
          },
          {
            $expr: {
              $eq: [
                "$accountID",
                {
                  $ifNull: [accountID, "$accountID"],
                },
              ],
            },
          },
          {
            $expr: {
              $eq: [
                "$companyID",
                {
                  $ifNull: [companyID, "$companyID"],
                },
              ],
            },
          },
          {
            $expr: {
              $eq: [
                "$deptID",
                {
                  $ifNull: [deptID, "$deptID"],
                },
              ],
            },
          },
        ],
      },
    },
    {
      $set: {
        deptIDAsObjectID: {
          $toObjectId: "$deptID",
        },
        companyIDAsObjectID: {
          $toObjectId: "$companyID",
        },
      },
    },
    {
      $lookup: {
        from: "accounts",
        localField: "accountID",
        foreignField: "accountID",
        as: "accounts",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "accountID",
        foreignField: "accountID",
        as: "users",
      },
    },
    {
      $lookup: {
        from: "departments",
        localField: "deptIDAsObjectID",
        foreignField: "_id",
        as: "departments",
      },
    },
    {
      $lookup: {
        from: "companies",
        localField: "companyIDAsObjectID",
        foreignField: "_id",
        as: "companies",
      },
    },
    {
      $lookup: {
        from: "bank_details",
        localField: "accountID",
        foreignField: "accountID",
        as: "bankDetails",
      },
    },
    {
      $set: {
        accountInfo: {
          $first: "$accounts",
        },
        userInfo: {
          $first: "$users",
        },
        companyInfo: {
          $first: "$companies",
        },
        bankDetail: {
          $first: "$bankDetails",
        },
        deptInfo: {
          $first: "$departments",
        },
      },
    },
    {
      $set: {
        employeeID: { $toString: "$_id" },
        l_name: "$userInfo.l_name",
        f_name: "$userInfo.f_name",
        phonenum: "$accountInfo.phonenum",
        email: "$accountInfo.email",
        department: "$deptInfo.dept_name",
        company_name: "$companyInfo.company_name",
        bank_name: "$bankDetail.bank_name",
        acc_name: "$bankDetail.acc_name",
        acc_number: "$bankDetail.acc_number",
        acc_verified: {
          $and: [
            "$bankDetail.recipient_code",
            { $ne: ["", "$bankDetail.recipient_code"] },
          ],
        },
      },
    },
    {
      $set: {
        full_name: {
          $concat: ["$f_name", " ", "$l_name"],
        },
      },
    },
    {
      $unset: [
        "users",
        "userInfo",
        "accountInfo",
        "companyInfo",
        "bankDetail",
        "bankDetails",
        "deptInfo",
        "departments",
        "companies",
        "bank_details",
        "accounts",
        "deptIDAsObjectID",
        "companyIDAsObjectID",
      ],
    },
  ];
  return agg;
};

module.exports = composeGetEmployeesDetailsAgg;
