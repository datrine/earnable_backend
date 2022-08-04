const { mongoClient,startConn } = require("../conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
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