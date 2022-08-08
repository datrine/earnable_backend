const uniqid = require("uniqid")
function createRole(role, account) {
    if (!account) {
        return{
            name: role,
            id: uniqid(),
            listOfUsers: [],
            timeCreated: new Date()
        }
    }
    return {
        name: role,
        id: uniqid(),
        listOfUsers: [{
            email: account.email,
            accountID: account.accountID,
            addedOn:new Date()
        }],
        timeCreated: new Date()
    }
}

let defaultCompanyAdminRoles = ["createRole", "addUserToRole", "removeUserFromRole", "deleteRole"]
let defaultCompanyAdminViewRoles = ["canViewDashboard"]
let defaultCompanyActionRoles = ["addEmployee", "editEmployee", "deleteEmployee", "createWallet", "editWallet",];

/**
 * 
 * @param {object} param0 
 */
function setDefaultRoles({ roles = [], account }) {
    roles = (Array.isArray(roles) && roles.length > 0 && roles) ||
        [...defaultCompanyAdminRoles,...defaultCompanyAdminViewRoles, ...defaultCompanyActionRoles]
    let rolesObjArray = setRoles({roles, account});
    return rolesObjArray
}

function setRoles({ roles = [], account }) {
    let rolesObjArray = []
    for (const role of roles) {
        rolesObjArray.push(createRole(role, account))
    }
    return rolesObjArray
}

module.exports = { setDefaultRoles, setRoles, defaultCompanyActionRoles, defaultCompanyAdminRoles,createRole }