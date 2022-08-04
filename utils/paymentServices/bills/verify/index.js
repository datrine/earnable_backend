const { verifyPaystackTransaction } = require("./paystack");

async function verifyPaymentInterface({ transactionId,platform }) {
    try {
        let res;
        switch (platform) {
            case "paystack":
                res = await verifyPaystackTransaction(transactionId)
                break;

            default:
                break;
        }
        if (res) {
            
        }
        return res
    } catch (error) {
        console.log(error)
    }
}

module.exports={verifyPaymentInterface}