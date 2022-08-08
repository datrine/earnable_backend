const router = require("express").Router()
const { mongoClient } = require("../utils/conn/mongoConn");
const tokenVerifyMW = require("../utils/mymiddleware/tokenVerifyMW");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies");
const companyRolesCol = waleprjDB.collection("companyRoles");
const { ObjectId } = require("bson");
const { getBiodataFunc } = require("./account");
const { cleanAndValidateNewCompany } = require("../utils/validators/companies");
const sessIDVerifyMW = require("../utils/mymiddleware/sessIDVerifyMW");

let createCompany = async ({ ...companyDataToCreate }) => {
    try {
        let companyData = cleanAndValidateNewCompany(companyDataToCreate);
        let result1 = await companiesCol.insertOne({
            ...companyData,
            lastModified: new Date(),
            createdOn: new Date(),
        });
        if (!result1.insertedId) {
            return { err: { msg: "Unable to create" } }
        }
        return { companyID: result1.insertedId.toString(), }
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};

let getCompaniesByIDs = async ({ ids }) => {
    try {
        console.log({ ids });
        let companiesCursor = await companiesCol.find({ _id: { $in: [...ids].map(id => ObjectId(id)) } });
        let companies = await companiesCursor.toArray();
        companies = companies.map(com => ({ ...com, companyID: com._id.toString() }))
        return { companies }
    } catch (error) {
        console.log(error)
    }
}

let getCompanyByID = async ({ id }) => {
    try {
        let companyDoc = await companiesCol.findOne({ _id: ObjectId(id) });
        if (!companyDoc) {
            return { err: { msg: "Company not found" } }
        }
        
        return { company:{...companyDoc,companyID:companyDoc._id.toString()} }
    } catch (error) {
        console.log(error)
    }
}
module.exports = { createCompany, getCompaniesByIDs, getCompanyByID };