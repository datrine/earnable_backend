const { mongoClient } = require("../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const accountsCol = waleprjDB.collection("accounts");

async function createAccount(user) {
    try {
        let account = await accountsCol.findOneAndUpdate({
            email: user.email
        }, {
            $setOnInsert: {
                email: user.email,
                createdOn:new Date(),
                //lastModified:new Date(),
            },
            $set: {
                lastModified:new Date(),
            }
        }, { upsert: true });
        if (!account.ok) {
            throw "unable to create account"
        }
        return account
    } catch (error) {
        console.log(error)
    }
}

module.exports={createAccount}