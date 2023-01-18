const { mongoClient, } = require("../conn/mongoConn");
const DB_NAME = process.env.DB_NAME;
const waleprjDB = mongoClient.db(DB_NAME);
const usersCol=waleprjDB.collection("users");
async function getUserFromDB({email}) {
    try {
  let user=  await usersCol.findOne({
        email,
    });
    return user;
    } catch (error) {
        console.log(error);
    }
}

module.exports={getUserFromDB}