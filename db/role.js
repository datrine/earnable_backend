const router = require("express").Router()
const { mongoClient } = require("../utils/conn/mongoConn");
const { createRole } = require("../utils/misc/company_roles");
const waleprjDB = mongoClient.db("waleprj");
const companyRolesCol = waleprjDB.collection("companyRoles");

let createInitialCompanyRoles = async (rolesData) => {
    try {
        let result1 = await companyRolesCol.insertOne({
            ...rolesData,
            lastModified: new Date(),
            createdOn: new Date(),
        });
        if (!result1.insertedId) {
            return { err: { msg: "Unable to create" } }
        }
        return { rolesID: result1.insertedId.toString(), }
    } catch (error) {
        console.log(error)
        return ({ err: error })
    }
};

let createNewRole = async ({ rolesID, roleObj }) => {
    try {
        let rolesDoc = await companyRolesCol.findOne({
            rolesID
        }, {});

        if (!rolesDoc._id) {
            return { err: { msg: "RolesID does not exist." } }
        }
        let roles = rolesDoc.roles;
        let roleIndex = [...roles].findIndex(obj => obj.name === roleObj.name);
        if (roleIndex > -1) {
            return { info: "role already exists" }
        }
        console.log(roleObj.name)
        roles.push(createRole(roleObj.name));
        companyRolesCol.updateOne({ rolesID }, { $set: { roles } });
        return { rolesID: rolesDoc._id.toString(), info: "role has been saved" }
    } catch (error) {
        console.log(error)
        return ({ err: error })
    }
};

let getCompanyRoles = async ({ companyID }) => {
    try {
        let result1 = await companyRolesCol.findOne({
            companyID
        });
        if (!result1) {
            return { err: { msg: "No roles match companyID." } }
        }
        let { roles } = result1
        return { roles }
    } catch (error) {
        console.log(error)
        return ({ err: error })
    }
};

let getScopeByAccID = async ({ companyID,accountID }) => {
    try {
        let result1 = await companyRolesCol.findOne({
            companyID,roles:{$elemMatch:{"listOfUsers.accountID":accountID}}
        });
        if (!result1) {
            return { err: { msg: "No roles match companyID." } }
        }
        let { roles } = result1;
        let rolenames = [...roles].map(item => item.name)
        return { scope: { rolenames } }
    } catch (error) {
        console.log(error)
        return ({ err: error })
    }
};

let addUsersToRole = async ({ accounts = [], companyID, role }) => {
    try {
        let rolesDoc = await companyRolesCol.findOne({
            companyID
        });
        if (!rolesDoc) {
            return { err: { msg: "CompanyID not matched." } }
        }
        let roleObj = rolesDoc.roles.find(obj => obj.name === role);
        if (!roleObj) {
            return { err: { msg: "Role doesn't not exist." } }
        }
        for (const account of accounts) {
            roleObj.listOfUsers.push(createRole(role, account))
        }
        let comp = await companyRolesCol.updateOne({ companyID }, { $set: { ...rolesDoc.roles } });
        if (!comp.acknowledged) {
            return { err: { msg: "Failed to add accounts to role." } }
        }
        return { info: "Saved to role" }
    } catch (error) {

    }
}

let removeUsersFromRole = async ({ accounts = [], companyID, role }) => {
    try {
        let rolesDoc = await companyRolesCol.findOne({
            companyID
        });
        if (!rolesDoc) {
            return { err: { msg: "CompanyID not matched." } }
        }
        let indexOfRole = [...rolesDoc.roles].indexOf(obj => obj.name === role);
        if (indexOfRole === -1) {
            return { err: { msg: "Role doesn't not exist." } }
        }
        let roleObj = [...rolesDoc.role][indexOfRole]
        for (const account of accounts) {
            let listOfUsers = [...roleObj.listOfUsers]
            let indexOfAccUser = listOfUsers.findIndex(obj => obj.accountID === account.accountID);
            if (indexOfAccUser > -1) {
                listOfUsers.splice(indexOfAccUser, 1)
            }
        }
        let comp = await companyRolesCol.updateOne({ companyID }, { $set: { ...rolesDoc.roles } });
        if (!comp.acknowledged) {
            return { err: { msg: "Failed to remove accounts from role." } }
        }
        return { info: "Accounts remove to role" }
    } catch (error) {

    }
}

let hasRole = async ({ accountID, rolename }) => {
    try {
        let rolesDoc = await companyRolesCol.findOne({ roles: { $elemMatch: { name: rolename,"listOfUsers.accountID":accountID } } });
        console.log(rolename)
        return !!rolesDoc?._id
    } catch (error) {
        console.log(error)
    }
}
let hasScope = async ({ accountID, rolenames }) => {
    try {
        let rolesDoc = await companyRolesCol.findOne({ accountID, roles: { $all: [...rolenames] } });
        console.log(rolesDoc)
        return !!rolesDoc?._id
    } catch (error) {
        console.log(error)
    }
}
module.exports = { createInitialCompanyRoles, addUsersToRole, getCompanyRoles, removeUsersFromRole, 
    createNewRole, hasRole, hasScope,getScopeByAccID };