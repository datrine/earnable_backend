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
                return res.json({ err: `Role name cannot be empty` })
            }
            if (!userObjs) {
                console.log(`userObjs array is not defined`)
                return res.json({ err: `userObjs array is not defined` })
            }
            if (!Array.isArray(userObjs)) {
                console.log(`'userObjs' must be an array`)
                return res.json({ err: `'userObjs' must be an array` })
            }
            if (userObjs.length < 1) {
                console.log(`'userObjs' array must not be empty`)
                return res.json({ err: `'userObjs' array must not be empty` })
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
                return res.json({ err: "No company id" })
            }

            for (const userObj of userObjs) {
                if (!((userObj.id || userObj._id) && userObj.email)) {
                    console.log("Wrong userObj format")
                    return res.json({
                        err:
                            `Wrong userObj format  for role action id '${name}'`,
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


module.exports = { companyRoleActionValidateMW };