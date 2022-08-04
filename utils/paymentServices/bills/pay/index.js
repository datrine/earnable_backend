const { response } = require("express");
const { payViaPaystack } = require("./paystack");

async function payFn({ platform, email, amount, orderId }) {
    try {
        let response;
        switch (platform) {
            case "paystack":
                response = await payViaPaystack({ email, reference: orderId, amount: amount * 100, })
                break;

            default:
                break;
        }
        console.log(response)
        return response
    } catch (error) {
        console.log(error)
    }
}

module.exports = { payFn }