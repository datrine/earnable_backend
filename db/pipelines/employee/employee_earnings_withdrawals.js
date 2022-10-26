const { DateTime } = require("luxon");

let employeeEarningsWithdrawalsAgg = ({accountID,from,to}) => {
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
               from,
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
               to,
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
     },{$unset:["filteredWithdrawals","withdrawals"]}]
   return agg;
}

module.exports = employeeEarningsWithdrawalsAgg;
