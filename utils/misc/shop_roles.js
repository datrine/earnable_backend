function createRole(role, account) {
    return {
        name: role,
        listOfUsers: [{
            _id: account._id,
            email: account.email,
            accountID:account.accountID
        }]
    }
}

let defaultCompanyAdminRoles = ["createRole", "addUserToRole", "removeUserFromRole", "deleteRole",]
let defaultCompanyActionRoles = ["addEmployee", "editEmployee", "deleteEmployee",]
/**
 * 
 * @param {object} param0 
 */
function setDefaultRoles({ roles = [], account }) {
    roles = (Array.isArray(roles) && roles.length > 0 && roles) ||
        [...defaultCompanyAdminRoles, ...defaultCompanyActionRoles]
    let rolesObjArray = []
    for (const role of roles) {
        rolesObjArray.push(createRole(role, account))
    }
    return rolesObjArray
}


module.exports = { setDefaultRoles, defaultCompanyActionRoles,defaultCompanyAdminRoles }