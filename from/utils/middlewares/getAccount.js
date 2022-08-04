const { request, response, } = require("express");
const { retrieveAccountInfoBasic, } = require("../../../db/account");

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {()=>{}} next 
 * @returns 
 */
let getAccount = async (req, res, next) => {
    try {
        let { identifier } = req.params
        if (!identifier) {
            res.status = 400
            return res.json({
                err: {
                    msg: "No identifier provided",
                    type: "no_id"
                }
            });
        }
        
        let accountRes = await retrieveAccountInfoBasic({ identifier });
        if (accountRes.err) {
            return res.json(accountRes)
        }
        req.session.account = accountRes.account
        next()
    } catch (error) {
        console.log(error);
        next("Server error")
    }
};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {()=>{}} next 
 * @returns 
 */
 let getMyAccount = async (req, res, next) => {
    try {
        let { identifier } = req.params
        if (!identifier) {
            res.status = 400
            return res.json({
                err: {
                    msg: "No identifier provided",
                    type: "no_id"
                }
            });
        }
        
        let accountRes = await retrieveAccountInfoBasic({ identifier });
        if (accountRes.err) {
            return res.json(accountRes)
        }
        req.session.account = accountRes.account
        next()
    } catch (error) {
        console.log(error);
        next("Server error")
    }
};

module.exports = {getAccount,getMyAccount}