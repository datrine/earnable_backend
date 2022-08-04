const { default: axios } = require('axios');
let PayStack = require('paystack-node');
const _ = require("lodash");
const { savePaymentDetail } = require('../../../dbmethods/payment_methods');

let APIKEY = 'sk_test_9b43dbc08afbbb51848c736377fb8915be9b969e'
const environment = process.env.NODE_ENV

const paystack = new PayStack(APIKEY, environment);

const resFromPaystack = {
    "status": true,
    "message": "Verification successful",
    "data": {
        "id": 690075529,
        "domain": "test",
        "status": "success",
        "reference": "nms6uvr1pl",
        "amount": 20000,
        "message": null,
        "gateway_response": "Successful",
        "paid_at": "2020-05-19T12:30:56.000Z",
        "created_at": "2020-05-19T12:26:44.000Z",
        "channel": "card",
        "currency": "NGN",
        "ip_address": "154.118.28.239",
        "metadata": "",
        "log": {
            "start_time": 1589891451,
            "time_spent": 6,
            "attempts": 1,
            "errors": 0,
            "success": true,
            "mobile": false,
            "input": [],
            "history": [
                {
                    "type": "action",
                    "message": "Attempted to pay with card",
                    "time": 5
                },
                {
                    "type": "success",
                    "message": "Successfully paid with card",
                    "time": 6
                }
            ]
        },
        "fees": 300,
        "fees_split": {
            "paystack": 300,
            "integration": 40,
            "subaccount": 19660,
            "params": {
                "bearer": "account",
                "transaction_charge": "",
                "percentage_charge": "0.2"
            }
        },
        "authorization": {
            "authorization_code": "AUTH_xxxxxxxxxx",
            "bin": "408408",
            "last4": "4081",
            "exp_month": "12",
            "exp_year": "2020",
            "channel": "card",
            "card_type": "visa DEBIT",
            "bank": "Test Bank",
            "country_code": "NG",
            "brand": "visa",
            "reusable": true,
            "signature": "SIG_xxxxxxxxxxxxxxx",
            "account_name": null
        },
        "customer": {
            "id": 24259516,
            "first_name": null,
            "last_name": null,
            "email": "customer@email.com",
            "customer_code": "CUS_xxxxxxxxxxx",
            "phone": null,
            "metadata": null,
            "risk_action": "default"
        },
        "plan": null,
        "order_id": null,
        "paidAt": "2020-05-19T12:30:56.000Z",
        "createdAt": "2020-05-19T12:26:44.000Z",
        "requested_amount": 20000,
        "transaction_date": "2020-05-19T12:26:44.000Z",
        "plan_object": {},
        "subaccount": {
            "id": 37614,
            "subaccount_code": "ACCT_xxxxxxxxxx",
            "business_name": "Cheese Sticks",
            "description": "Cheese Sticks",
            "primary_contact_name": null,
            "primary_contact_email": null,
            "primary_contact_phone": null,
            "metadata": null,
            "percentage_charge": 0.2,
            "settlement_bank": "Guaranty Trust Bank",
            "account_number": "0123456789"
        }
    }
}

/**
 * 
 * @param {*} reference 
 * @returns {res}
 */
async function payViaPaystack({ reference, amount, email }) {
    try {
        /**
         * @type {{data: resFromPaystack}}
         */
        const res =
            await axios.post("https://api.paystack.co/transaction/initialize", {
                //reference: "yuyfgugvfyffgyuuu",
                amount, email
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${APIKEY}`
                }
            });
        await savePaymentDetail({
            email,
            detail: res.data,
            platform: "paystack",
            orderId:reference,
            state:"initialized",
            transactionId: res.data.data.reference,
        })
        return {
            transactionId: res.data.data.reference,
            authorization_url: res.data.data.authorization_url,
            access_code: res.data.data.access_code,
        };
    } catch (error) {
        if (error.isAxiosError) {
            if (error.request) {
                //console.log(Object.keys(error.request) )
            }
            if (error.response) {
                console.log(error.response.data);
                console.trace()
            }
        }
        //let errObj= serverError(error);
        //console.log(errObj)
    }
}

module.exports = { payViaPaystack }



