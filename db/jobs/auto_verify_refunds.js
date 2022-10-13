const { paystackVerify } = require("../../utils/payments/paystack");
const { updateRefundByTransactionID } = require("../refund");
const {
  getTransactionsByFilters,
  updateTransactionByTransactionReference,
} = require("../transaction");

let autoVerifyRefunds = async () => {
  try {
    let { transactions } = await getTransactionsByFilters({
      status: "initiated",
      type: "refund",
    });
    if (!transactions) {
      return;
    }
    let mapped = transactions.map((trx) => ({
      transactionID: trx._id.toString(),
      reference:trx. transaction_reference,
      companyID: trx.companyID,
    }));
    let promises = mapped.map((obj) =>
      paystackVerify({ reference: obj.reference ,transactionID:obj.transactionID})
    );
    let results = await Promise.allSettled([...promises]);
    for (const result of results) {
      if (result.status === "rejected") {
        continue;
      }
      let response = result.value?.data;
      if (!response) {
        continue;
      }
      let data = response.data;
      let transactionID=result.value.transactionID;
      if (data.status === "failed") {
        let updateTransactionByTransactionReferenceRes =
          await updateTransactionByTransactionReference({
            transaction_reference: data.reference,
            updates: { status: "failed" },
          });
          await  updateRefundByTransactionID({transactionID,updates:{status:"failed"}});
        return;
      }

      if (data.status === "success") {
        let updateTransactionByTransactionReferenceRes =
          await updateTransactionByTransactionReference({
            transaction_reference: data.reference,
            updates: { status: "completed" },
          });
      await  updateRefundByTransactionID({transactionID,updates:{status:"completed"}});
      }
    }
  } catch (error) {
    console.log(error)
    return { err: error };
  }
};

module.exports = { autoVerifyRefunds };
