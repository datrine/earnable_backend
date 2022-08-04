const router = require("express").Router()
const { mongoClient, ObjectID } = require("../../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const companiesCol = waleprjDB.collection("companies");
const {  companyRoleActionValidateMW } = require("../../../../utils/mymiddleware/roleMW");

router.put("/", companyRoleActionValidateMW, async (req, res, next) => {
    try {
        res.status(400)
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
        return res.json({ info: "added to role" })
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
});

module.exports = router;