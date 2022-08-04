const { default: axios } = require("axios");
const AUTH_SERVER = process.env.NODE_ENV === "production" ?
    process.env.AUTH_SERVER : "http://localhost:7000";


const { accountAccIDResetSet, getBiodataFunc } = require("../../db/account");
const { directLoginFunc, emailLoginFunc } = require("../../db/login");
const { accTemplate } = require("../../db/templates");



/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let sessIDVerifyMW = async (req, res, next) => {
    try {
        res.status(403)
        if (!req.headers["authorization"]) {
            res.status(401);
            console.log("No authorization header")
            return res.json({ err: "No authorization header" })
        }
        let sessID = req.headers["authorization"].split(" ")[1];
        console.log("sessID "+sessID);

        let { session } = req

        /**
                * @type {accTemplate}
                */
        let account = session.account;
        if (account?.loginInfo?.current_session) {
            let cur_sess = account.loginInfo.current_session;
            if (sessID !== cur_sess.sessID) {
                console.log("sessID not valid");
                return res.json({ err: { msg: "AccessID not valid" } })
            }
            if (new Date() > cur_sess.expires_on) {
                console.log("current account session has expired");
                return res.json({ err: { msg: "current account session has expired" } })
            }
        }
        //if account doesn't exist in session
        else {
            //if both email and sessID are not supplied, reject
            if (!sessID) {
                console.log("sessID cannot be empty");
                return res.json({ err: { msg: "sessID cannot be empty" } })
            }
        }
        console.log("sessID what????????");
        let { state, account: accFromServer, err } =
            await accountAccIDResetSet({ sessID });
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        if (!accFromServer) {
            return res.json({ state, })
        }
        req.session.account = accFromServer;
        req.session.state = state;
        req.session.sessID = accFromServer.loginInfo.current_session.sessID;


        /*  let responseFromAuth = await axios.get(`${AUTH_SERVER}/api/me`, {
              headers: {
                  "Authorization": `Bearer ${sessID}`
              }
          });
          let data = responseFromAuth.data
          if (data.err) {
             return res.json(data)
          }
          if (!data.account) {
             return res.json({ err: { msg: "No account attached..." } })
          }
          req.session.account = data.account;
   */

        next()
    } catch (error) {
        console.log(error)
        res.json({ err: "Some error" })
    }
}


module.exports = sessIDVerifyMW;