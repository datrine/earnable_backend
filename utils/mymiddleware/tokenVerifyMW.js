const { mongoClient } = require("../conn/mongoConn");
const { verifyToken } = require("../encdec");
const waleprjDB = mongoClient.db("waleprj");
const usersCol = waleprjDB.collection("users");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let tokenVerifyMW = (req, res, next) => {
    try {
        res.status(403)
        
        if (!req.headers["authorization"]) {
            res.status(401);
            console.log( "No authorization header")
            return res.json({ err: "No authorization header" })
        }
        let token = req.headers["authorization"].split(" ")[1];
         verifyToken(token, (err, data) => {
            if (err) {
                console.log(err)
                return res.json({ err: err.message })
            }
            usersCol.findOne({
                email: data.email
            }, { projection: { passHash: 0 } }, (err, result) => {
                if (err) {
                    console.log(err)
                    return res.json({ err })
                }
                if (!result) {
                    console.log(err)
                    return res.json({ err: "No user with email " + data.email })
                }
                res.status(200)
                req.user = result;
               return next()
            })
        });
    } catch (error) {
        console.log(error)
        res.json({ err: "Some error" })
    }
}


module.exports = tokenVerifyMW;