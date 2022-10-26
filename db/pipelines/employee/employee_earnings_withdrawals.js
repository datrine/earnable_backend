const { DateTime } = require("luxon");
const { ObjectId } = require("mongodb");

let dashboardInfoAgg = ({accountID}) => {
   let agg = [{
      $match: {
       $expr: {
        $and: [
         {
          $eq: [
            accountID,
           '$accountID'
          ]
         }
        ]
       }
      }
     }, {
      $lookup: {
       from: 'employees',
       localField: 'accountID',
       foreignField: 'accountID',
       as: 'employee'
      }
     }, {
      $set: {
       employeeInfo: {
        $first: '$employee'
       }
      }
     }, {
      $lookup: {
       from: 'withdrawals',
       localField: 'accountID',
       foreignField: 'accountID',
       as: 'withdrawals'
      }
     }, {
      $lookup: {
       from: 'companies',
       localField: 'companyIDAsObjectID',
       foreignField: '_id',
       as: 'companies'
      }
     }, {
      $set: {
       filteredWithdrawals: {
        $filter: {
         input: '$withdrawals',
         cond: {
          $and: [
           {
            $eq: [
             '$$withdrawal.status.name',
             'completed'
            ]
           },
           {
            $gte: [
             {
              $ifNull: [
               null,
               '$$withdrawal.status.updated'
              ]
             },
             '$$withdrawal.status.updated'
            ]
           },
           {
            $lte: [
             {
              $ifNull: [
               null,
               '$$withdrawal.status.updated'
              ]
             },
             '$$withdrawal.status.updated'
            ]
           }
          ]
         },
         as: 'withdrawal'
        }
       }
      }
     }, {
      $set: {
       mappedFilteredWithdrawals: {
        $map: {
         input: '$filteredWithdrawals',
         as: 'item',
         'in': {
          title: 'Earning',
          amount: '$$item.transactionInfo.netAmountToWithdraw',
          date: '$$item.createdOn'
         }
        }
       }
      }
     }]
   return agg;
}

module.exports = dashboardInfoAgg;
