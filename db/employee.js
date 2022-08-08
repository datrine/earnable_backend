const router = require("express").Router()
const { mongoClient } = require("../utils/conn/mongoConn");
const tokenVerifyMW = require("../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const companyRolesCol = waleprjDB.collection("companyRoles");
const { ObjectId } = require("bson");
const { getBiodataFunc } = require("./account");
const { cleanAndValidateNewCompany } = require("../utils/validators/companies");
const sessIDVerifyMW = require("../utils/mymiddleware/sessIDVerifyMW");

let AddEmployee = async ({ ...employeeToData }) => {
    try {
        let result1 = await employeesCol.insertOne({
            ...employeeToData,
            lastModified: new Date(),
            createdOn: new Date(),
        });
        if (!result1.insertedId) {
            return { err: { msg: "Unable to Add employee..." } }
        }
        return { employeeID: result1.insertedId.toString(), }
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};

let getCompaniesByIDs = async ({ ids }) => {
    try {
        console.log({ ids });
        let companiesCursor = await employeesCol.find({ _id: { $in: [...ids].map(id => ObjectId(id)) } });
        let companies = await companiesCursor.toArray();
        companies = companies.map(com => ({ ...com, companyID: com._id.toString() }))
        return { companies }
    } catch (error) {
        console.log(error)
    }
}

let getCompanyByID = async ({ id }) => {
    try {
        let companyDoc = await employeesCol.findOne({ _id: ObjectId(id) });
        if (!companyDoc) {
            return { err: { msg: "Company not found" } }
        }
        
        return { company:{...companyDoc,companyID:companyDoc._id.toString()} }
    } catch (error) {
        console.log(error)
    }
}
module.exports = { createCompany: AddEmployee, getCompaniesByIDs, getCompanyByID };