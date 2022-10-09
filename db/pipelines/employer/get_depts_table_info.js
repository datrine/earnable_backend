const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let composeGetDeptInfoTableAgg = ({
  companyID,
}) => {
  console.log({companyID})
  let agg=[{
    $match: {
     $and: [
      {
       $expr: {
        $eq: [
         '$companyID',
         {
          $ifNull: [
           companyID,
           '$companyID'
          ]
         }
        ]
       }
      }
     ]
    }
   }, {
    $set: {
     deptIDAsString: {
      $toString: '$_id'
     }
    }
   }, {
    $lookup: {
     from: 'employees',
     localField: 'deptIDAsString',
     foreignField: 'deptID',
     as: 'employees'
    }
   }, {
    $set: {
     employeeCount: {
      $size: '$employees'
     }
    }
   }, {
    $unset: [
     'deptIDAsString',
     'employees'
    ]
   },];
  return agg;
};

module.exports=composeGetDeptInfoTableAgg
