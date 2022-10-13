
/**
 * @param {object}params
 * @param {string}params.email
 * @param {number}params.amount
 * @param {string}params.reference
 * @param {string}params.callback_url
 * @param {["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer", "eft"]}params.channels
 */
let paystackInitiate = async (params) => {
  try {
    let channels = params.channels || [
      "card",
      "bank",
      "ussd",
      "qr",
      "mobile_money",
      "bank_transfer",
      "eft",
    ];
    let response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "post",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...params, channels }),
      }
    );
    if (!response.ok) {
      throw await response.text();
    }
    /**
     * @type {paystackInitializeDataResponse}
     */
    let data = await response.json();
    return { data };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let paystackInitializeDataResponse = {
  status: true,
  message: "Authorization URL created",
  data: {
    authorization_url: "https://checkout.paystack.com/0peioxfhpn",
    access_code: "0peioxfhpn",
    reference: "7PVGX8MEk85tgeEpVDtD",
  },
};

/**
 * @param {object}params
 * @param {string}params.reference
 * @param {string}params.transactionID
 */
let paystackVerify = async ({ reference,transactionID }) => {
  try {
    let response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "get",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    if (!response.ok) {
      throw await response.text();
    }
    /**
     * @type {paystackVerifySuccessDataResponse|paystackVerifyFailDataResponse}
     */
    let data = await response.json();
    return { data,transactionID };
  } catch (error) {
    console.log(error);
    return { err: error };
  }
};

let paystackVerifySuccessDataResponse = {
  status: true,
  message: "Verification successful",
  data: {
    id: 2009945086,
    domain: "test",
    /**
     * @type {"success"}
     */
    status: "success",
    reference: "rd0bz6z2wu",
    amount: 20000,
    message: null,
    gateway_response: "Successful",
    paid_at: "2022-08-09T14:21:32.000Z",
    created_at: "2022-08-09T14:20:57.000Z",
    channel: "card",
    currency: "NGN",
    ip_address: "100.64.11.35",
    metadata: "",
    log: {
      start_time: 1660054888,
      time_spent: 4,
      attempts: 1,
      errors: 0,
      success: true,
      mobile: false,
      input: [],
      history: [
        {
          type: "action",
          message: "Attempted to pay with card",
          time: 3,
        },
        {
          type: "success",
          message: "Successfully paid with card",
          time: 4,
        },
      ],
    },
    fees: 100,
    fees_split: null,
    authorization: {
      authorization_code: "AUTH_ahisucjkru",
      bin: "408408",
      last4: "4081",
      exp_month: "12",
      exp_year: "2030",
      channel: "card",
      card_type: "visa ",
      bank: "TEST BANK",
      country_code: "NG",
      brand: "visa",
      reusable: true,
      signature: "SIG_yEXu7dLBeqG0kU7g95Ke",
      account_name: null,
    },
    customer: {
      id: 89929267,
      first_name: null,
      last_name: null,
      email: "hello@email.com",
      customer_code: "CUS_i5yosncbl8h2kvc",
      phone: null,
      metadata: null,
      risk_action: "default",
      international_format_phone: null,
    },
    plan: null,
    split: {},
    order_id: null,
    paidAt: "2022-08-09T14:21:32.000Z",
    createdAt: "2022-08-09T14:20:57.000Z",
    requested_amount: 20000,
    pos_transaction_data: null,
    source: null,
    fees_breakdown: null,
    transaction_date: "2022-08-09T14:20:57.000Z",
    plan_object: {},
    subaccount: {},
  },
};

let paystackVerifyFailDataResponse={  
    "status":true,
    "message":"Verification successful",
    "data": {
      "id": 20250386,  
      "amount":27000,
      "currency":"NGN",
      "transaction_date":"2016-10-01T11:03:09.000Z",
      /**
       * @type {"failed"}
       */
      "status":"failed",
      "reference":"djfoidjkdkj41",
      "domain":"test",
      "metadata":0,
      "gateway_response":"Insufficient Funds",
      "message":null,
      "channel":"card",
      "ip_address":"41.1.25.1",
      "log": {  
        "time_spent":9,
        "attempts":1,
        "authentication":null,
        "errors":0,
        "success":true,
        "mobile":false,
        "input":[ ],
        "channel":null,
        "history": [  
           {  
             "type":"input",
             "message":"Filled these fields: card number, card expiry, card cvv",
             "time":7
           },
           {  
             "type":"action",
             "message":"Attempted to pay",
             "time":7
           },
           {  
             "type":"close",
             "message":"Page closed",
             "time":9
           }
        ]
      },
      "fees":null,
      "authorization":{  
        "authorization_code":"AUTH_8dfhjjdt",
        "card_type":"visa",
        "last4":"1381",
        "exp_month":"08",
        "exp_year":"2018",
        "bin":"412345",
        "bank":"TEST BANK",
        "channel":"card",
        "signature": "SIG_idyuhgd87dUYSHO92D",
        "reusable":true,
        "country_code":"NG",
        "account_name": "BoJack Horseman"
      },
      "customer":{  
        "id":84312,
        "customer_code":"CUS_hdhye17yj8qd2tx",
        "first_name":"BoJack",
        "last_name":"Horseman",
        "email":"bojack@horseman.com"
      },
      "plan":""
    }}
module.exports = { paystackInitiate ,paystackVerify};
