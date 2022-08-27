

let transferVerifyResponseObj={
    "status": true,
    "message": "Transfer retrieved",
    "data": {
      "integration": 119333,
      "recipient": {
        "domain": "test",
        "type": "nuban",
        "currency": "NGN",
        "name": "Zombie",
        "details": {
          "account_number": "0100000001",
          "account_name": null,
          "bank_code": "044",
          "bank_name": "Access Bank"
        },
        "description": "Zombier",
        "metadata": "",
        "recipient_code": "RCP_c2mty1w1uvd4av4",
        "active": true,
        "email": null,
        "id": 31911,
        "integration": 119333,
        "createdAt": "2017-10-13T20:35:51.000Z",
        "updatedAt": "2017-10-13T20:35:51.000Z"
      },
      "domain": "test",
      "amount": 50000,
      "currency": "NGN",
      "reference": "ref_demo",
      "source": "balance",
      "source_details": null,
      "reason": "Test for reference",
      "status": "success",
      "failures": null,
      "transfer_code": "TRF_kjati32r73poyt5",
      "titan_code": null,
      "transferred_at": null,
      "id": 476948,
      "createdAt": "2018-07-22T10:29:33.000Z",
      "updatedAt": "2018-07-22T10:29:33.000Z"
    }
  }

  let initiateTransferResonseObj={
    "status": true,
    "message": "Transfer requires OTP to continue",
    "data": {
      "integration": 100073,
      "domain": "test",
      "amount": 3794800,
      "currency": "NGN",
      "source": "balance",
      "reason": "Calm down",
      "recipient": 28,
      "status": "otp",
      "transfer_code": "TRF_1ptvuv321ahaa7q",
      "id": 14,
      "createdAt": "2017-02-03T17:21:54.508Z",
      "updatedAt": "2017-02-03T17:21:54.508Z"
    }
  }

  module.exports={transferVerifyResponseObj,initiateTransferResonseObj}