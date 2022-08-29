const router = require("express").Router()
const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const bank_detailsCol = waleprjDB.collection("bank_details");
const { ObjectId } = require("bson");
const { nanoid } = require("nanoid");
const { transferVerifyResponseObj, initiateTransferResonseObj } = require("./templates/paystack/responses");
/**
 * 
 * @param {object} param0
 * @param {string} param0.bank_name
 * @param {string} param0.acc_number
 * @param {string} param0.acc_name
 * @param {string} param0.acc_type
 * @returns 
 */
let addBankDetail = async ({ ...bankDetails }) => {
    try {
        let result1 = await bank_detailsCol.insertOne({
            ...bankDetails,
            lastModified: new Date(),
            createdOn: new Date(),
        });
        if (!result1.insertedId) {
            return { err: { msg: "Unable to Add bank detail..." } }
        }
        return { bankDetailID: result1.insertedId.toString(), }
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};

let getBankDetailsByAccountID = async ({ accountID }) => {
    try {
        let accBankDetails = await bank_detailsCol.findOne({ accountID });
        if (!accBankDetails) {
            return { err: { msg: "No bank details." } }
        }
        return { bankDetails: accBankDetails }
    } catch (error) {
        console.log(error)
    }
}

let getEmployeeByEmployeeID = async ({ employeeID }) => {
    try {
        let employeeDoc = await bank_detailsCol.find({ _id: ObjectId(employeeID) });
        if (!employeeDoc) {
            return { err: { msg: "Company not found" } }
        }

        return { company: { ...employeeDoc, employeeID: employeeDoc._id.toString() } }
    } catch (error) {
        console.log(error)
    }
}

let updateRecieptCodeEmployeeID = async ({ bankDetailID, recipient_code }) => {
    try {
        let updateRes = await bank_detailsCol.findOneAndUpdate({ _id: ObjectId(bankDetailID) }, {
            $set: { recipient_code }
        });
        if (!updateRes.ok) {
            return { err: { msg: "Company not found" } }
        }

        return { info: "Recipient code saved" }
    } catch (error) {
        console.log(error)
    }
}

let createRecipientCode = async ({ acc_name, acc_number, bank_code, bankDetailID }) => {
    try {
        let bankObj = {
            "type": "nuban",
            "name": acc_name,
            "account_number": acc_number,
            "bank_code": bank_code,
            "currency": "NGN"
        }
        let response = await fetch("https://api.paystack.co/transferrecipient", {
            method: "post",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ...bankObj })
        });
        let jsonObj = await response.json();
        let { data } = jsonObj
        if (data?.active) {
            let recipient_code = data.recipient_code;
            return { info: "recipient code created.", recipient_code }
        }
    } catch (error) {
        console.log(error)
    }
};

let initiateTransfer = async ({ source = "balance", reason, amount, recipient }) => {
    try {
        let response = await fetch("https://api.paystack.co/transfer", {
            method: "post",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ source, reason, amount, recipient })
        });
        /**
         * @type {initiateTransferResonseObj}
         */
        let jsonObj = await response.json();
        if (jsonObj.status!==true) {
            return {err:{msg:"Transfer failed. "}}
        }
        return { ...jsonObj.data }

    } catch (error) {
        console.log(error);
        return { err: error }
    }
};

let verifyTransfer = async ({ transfer_code }) => {
    try {
        let response = await fetch(`https://api.paystack.co/transfer/${transfer_code}`, {
            method: "get",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        /**
         * @type {transferVerifyResponseObj}
         */
        let jsonObj = await response.json();
        //console.log(jsonObj);
        if (jsonObj.status !== true) {
        }
            return { data: jsonObj.data }
    } catch (error) {
        console.log(error);
        throw error
    }
};



module.exports = {
    addBankDetail, getBankDetailsByAccountID, getEmployeeByEmployeeID, updateRecieptCodeEmployeeID,
    createRecipientCode, initiateTransfer, verifyTransfer
};