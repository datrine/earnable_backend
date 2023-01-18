const router = require("express").Router()
const { mongoClient, ObjectID } = require("../../../../utils/conn/mongoConn");
const tokenVerifyMW = require("../../../../utils/mymiddleware/tokenVerifyMW");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const companiesCol = waleprjDB.collection("companies")
const { setDefaultRoles } = require("../../../../utils/misc/company_roles");
const { companyRoleActionValidateMW } = require("../../../../utils/mymiddleware/roleMW");

router.delete("/", tokenVerifyMW, companyRoleActionValidateMW,
 async (req, res, next) => {
    try {
        res.status(400)
        let user = req.user
        let data = req.body;
        let { shopId, roleObjs, } = data
        let resultFindUserCanRemoveUserFromRole = await companiesCol.findOne({
            _id: new ObjectID(shopId),
            roles: {
                $elemMatch: {
                    name: {
                        $eq: "removeUserFromRole"
                    },
                    "listOfUsers.email": user.email
                }
            },
        });
        //console.log(resultFindUserCanAddUserToRole)
        if (!resultFindUserCanRemoveUserFromRole) {
            console.log("User Not  Authorized to remove another from role")
            return res.json({ err: "User Not  Authorized to remove another from role" });
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
                            $pull:
                                { "roles.$[role].listOfUsers": { $in: roleObj.userObjs } }
                        },
                        upsert: true
                    }
                    updateOneArray.push({ updateOne })
                }
                let result = await companiesCol.bulkWrite([...updateOneArray,], { session });
                console.log(result)
            });
            //await session.endSession();
        } catch (error) {
            console.log("failed...");
            return res.json({ err: error });
        } finally {
            // await session.endSession();
        }
        res.status(204)
        return res.json({ info: "remove from role" });
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
});

module.exports = router;