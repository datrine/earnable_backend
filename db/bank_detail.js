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

let getEmployeesByCompanyID = async ({ ids }) => {
    try {
        let employeesCursor = await bank_detailsCol.find({ _id: { $in: [...ids].map(id => ObjectId(id)) } });
        let employees = await employeesCursor.toArray();
        employees = employees.map(com => ({ ...com, employeeID: com._id.toString() }))
        return { employees }
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

module.exports = { addBankDetail, getEmployeesByCompanyID, getEmployeeByEmployeeID };