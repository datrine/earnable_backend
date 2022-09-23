const { retrieveAccountInfoBasic } = require("../../db/account");
const { hasRole, hasScope } = require("../../db/role");
const { mongoClient } = require("../conn/mongoConn");
const { verifyToken } = require("../encdec");
const { defaultCompanyAdminRoles, defaultCompanyActionRoles } = require("../misc/company_roles");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let companyRoleActionValidateMW = async (req, res, next) => {
    try {
        res.status(400)
        let account = req.session.account
        let data = req.body;
        if (!data.companyId) {
            console.log("No companyId")
            return res.json({ err: "No company id" })
        }

        if (!data.roleObjs) {
            console.log("No roles selected")
            return res.json({ err: "No roles selected" })
        }

        if (!Array.isArray(data.roleObjs)) {
            console.log("RoleObjs must be array")
            return res.json({ err: "RoleObjs must be array" })
        }

        if (data.roleObjs.length < 1) {
            console.log("RoleObjs array cannot be empty")
            return res.json({ err: "RoleObjs array cannot be empty" })
        }

        for (const { name, userObjs } of data.roleObjs) {
            if (!name) {
                console.log(`Role name cannot be empty`)
                return res.json({ err: `Role name cannot be empty` });
            }
            if (!userObjs) {
                console.log(`userObjs array is not defined`)
                return res.json({ err: `userObjs array is not defined` })
            }
            if (!Array.isArray(userObjs)) {
                console.log(`'userObjs' must be an array`)
                return res.json({ err: `'userObjs' must be an array` });
            }
            if (userObjs.length < 1) {
                console.log(`'userObjs' array must not be empty`)
                return res.json({ err: `'userObjs' array must not be empty` });
            }
            let foundRole = defaultCompanyAdminRoles.
                find(defaultRole => defaultRole === name) || defaultCompanyActionRoles.
                    find(defaultRole => defaultRole === name)
            if (!foundRole) {
                console.log(`No role found that match '${name}'`)
                return res.json({ err: `No role found that match '${name}'` })
            }
            if (!userObjs) {
                console.log("No users selected to be added to role")
                return res.json({ err: "No users selected to be added to role" })
            }
            let mapConfirmedIdentifiers=await Promise.allSettled( userObjs.map(obj=>retrieveAccountInfoBasic({identifier:obj.email}) ))
            for (const userConfirmed of mapConfirmedIdentifiers) {
                if (userConfirmed.status==="rejected") {
                    return res.json({
                        err:
                            {msg:"Error looking up"},
                        format: userObj
                    })
                }
            }
        }
        res.status(200)
        return next()
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};

let hasRoleMW = async (req, res, next) => {
    try {
        let accountID = req.session.accountID
        let rolename = req.session.rolename
        let hasRoleRes = await hasRole({ accountID, rolename });
        if (!hasRoleRes) {
            return res.json({ err: { msg: `No role ${rolename} access.` } })
        }
        req.session.hasRole = hasRoleRes;
        next()
    } catch (error) {
        console.log(error)
    }
}

let hasAdminScopeMW = async (req, res, next) => {
    try {
        let accountID = req.session.accountID
        let hasScopeRes = await hasScope({ accountID, rolenames: [...defaultCompanyAdminRoles] });
        if (!hasScopeRes) {
            return res.json({ err: { msg: "No scope access." } })
        }
        req.session.hasScope = hasScope;
        next()
    } catch (error) {
        console.log(error)
    }
}

let addToRole=async (req, res, next) => {
    try {
        res.status(400);
        let user = req.user
        let data = req.body;
        let { shopId, roleObjs, } = data
        let resultFindUserCanAddUserToRole = await companiesCol.findOne({
            _id: new ObjectID(shopId),
            roles: {
                $elemMatch: {
                    name: {
                        $eq: "addUserToRole"
                    },
                    "listOfUsers.email": user.email
                }
            },
        });
        //console.log(resultFindUserCanAddUserToRole)
        if (!resultFindUserCanAddUserToRole) {
            console.log("User Not  Authorized to add another to role")
            return res.json({ err: "User Not  Authorized to add another to role" });
        };

        const session = mongoClient.startSession();
        try {
            await session.withTransaction(async () => {
                let updateOneArray = []
                for (const roleObj of roleObjs) {
                    const updateOne = {
                        filter: {
                            _id: new ObjectID(shopId),
                            "roles.name": { $eq: roleObj.name }
                        },
                        arrayFilters: [{ "role.name": { $eq: roleObj.name } }],
                        update: {
                            $addToSet:
                                { "roles.$[role].listOfUsers": { $each: roleObj.userObjs } }
                        },
                        upsert: true
                    }
                    updateOneArray.push({ updateOne })
                }
                //console.log(JSON.stringify(updateOneArray,null,2) )
                let result = await companiesCol.bulkWrite([...updateOneArray,], { session });
                console.log(result)
            });
            //await session.endSession();
        } catch (error) {
            console.log("failed...");
            console.log(error)
            return res.json({ err: error });
        } finally {
            // await session.endSession();
        }
        res.status(201)
     res.json({ info: "added to role" })
     next()
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
}

module.exports = { companyRoleActionValidateMW,hasAdminScopeMW,hasRoleMW,addToRole };