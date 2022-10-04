const { request, response, } = require("express");
const { retrieveAccountInfoBasic, accountAccIDResetSet, retrieveAccountInfoBySessID, } = require("../../../db/account");

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {()=>{}} next 
 * @returns 
 */
let getAuthAccount = async (req, res, next) => {
    try {
        req.session.self={...req.session.self}
        let sessID = req.headers.authorization?.split(" ")[1];
        if (!sessID) {
            return res.json({
                err: {
                    msg: "No bearer token added",
                    type: "no_auth_token"
                }
            })
        }
        req.session.sessID = sessID
        req.session.self.sessID = sessID
        let accountRes = await retrieveAccountInfoBySessID(sessID);
        if (accountRes.err) {
            return res.json(accountRes)
        }
        req.session.account = accountRes.account
        req.session.self.account = accountRes.account;

        let email = req.query.email;
        let { session } = req
        /**
         * @type {accTemplate}
         */
        let account = session.account;
        if (account?.loginInfo?.current_session) {
            let cur_sess = account.loginInfo.current_session;
            if (sessID !== cur_sess.sessID) {
                return res.json({ err: { msg: "AccessID not valid" } })
            }
            if (new Date() > cur_sess.expires_on) {
                return res.json({ err: { msg: "current account session has expired" } })
            }
        }
        //if account doesn't exist in session
        else {
            //if both email and sessID are not supplied, reject
            if (!sessID) {
                return res.json({ err: { msg: "sessID cannot be empty" } })
            }
        }
        let { state, account: accFromServer, err } = await accountAccIDResetSet({ sessID });
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        if (!accFromServer) {
            return res.json({ state, })
        }
        req.session.account = accFromServer;
        req.session.accountID = accFromServer.accountID;
        req.session.state = state;
        req.session.sessID = accFromServer.loginInfo.current_session.sessID;
        req.session.self.account = accFromServer;
        req.session.self.accountID = accFromServer.accountID;
        req.session.self.state = state;
        req.session.self.sessID = accFromServer.loginInfo.current_session.sessID;
        next()
    } catch (error) {
        console.log(error);
        res.json(error)
    }
}
module.exports= {getAuthAccount}