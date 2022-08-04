const router = require("express").Router();
const { mongoClient } = require("../../../utils/conn/mongoConn");
const { validateEmailTokenVerification } = require("../../../utils/emailServices/newUserEmail");
const waleprjDB = mongoClient.db("waleprj");
const usersCol = waleprjDB.collection("users")

router.get("/", async (req, res, next) => {
    try {
        let token = req.query.token
        console.log(token)
        let res = validateEmailTokenVerification(token);
        console.log(res)
        let result=await usersCol.updateOne({
            email: res.email
        }, {
            $set: {
                emailVerified:true
            }
        });
        if (result.upsertedCount) {
            console.log("Email verified...")
        }
        
    } catch (error) {
        console.log(error)
    }
});


module.exports = router;