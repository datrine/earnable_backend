const router = require("express").Router()
const { mongoClient } = require("../utils/conn/mongoConn");
const tokenVerifyMW = require("../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const bank_detailsCol = waleprjDB.collection("bank_details");
const companyRolesCol = waleprjDB.collection("companyRoles");
const { ObjectId } = require("bson");
const { cleanAndValidateNewCompany } = require("../utils/validators/companies");
const sessIDVerifyMW = require("../utils/mymiddleware/sessIDVerifyMW");
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

let createRecipientCode = async ({ l_name, f_name, acc_number, bank_code, bankDetailID }) => {
    try {
        let bankObj = {
            "type": "nuban",
            "name": l_name + " " + f_name,
            "account_number": acc_number,
            "bank_code": bank_code,
            "currency": "NGN"
        }
        console.log(bankObj)
        let response = await fetch("https://api.paystack.co/transferrecipient", {
            method: "post",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            },
            body: JSON.stringify({ ...bankObj })
        });
        let jsonObj = await response.json();
        console.log(jsonObj)
        let {data}=jsonObj
        if (data?.active) {
            let recipient_code = data.recipient_code;
            return { info:"recipient code created.", recipient_code }
        }
    } catch (error) {
        console.log(error)
    }
};
module.exports = { addBankDetail, getBankDetailsByAccountID, getEmployeeByEmployeeID, updateRecieptCodeEmployeeID, createRecipientCode };