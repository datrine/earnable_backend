const { retrieveAccountInfoBySessID } = require("../../../db/account");

let sessConfirmMW = async (req, res, next) => {
    try {
        let sessID = req.headers.authorization?.split(" ")[1];
        if (!sessID) {
            return res.json({
                err: {
                    msg: "No bearer token added",
                    type: "no_auth_token"
                }
            })
        }
        
        let retrieveAccBySessIDRes = await retrieveAccountInfoBySessID(sessID);
        if (retrieveAccBySessIDRes.err) {
            return res.json(retrieveAccBySessIDRes)
        }
        req.session.account = retrieveAccBySessIDRes.account
        req.session.sessID = sessID
        next()
    } catch (error) {
        console.log(error);
        next(error)
    }
};

module.exports= {sessConfirmMW}