const { findAndVerifyOTPToken } = require("../../db/otp_token");
const { findAndVerifyToken } = require("../../db/token");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let transactionTokenVerMW= async (req, res, next) => {
    try {
        let {otp} = req.body;
        if (!otp) {
            return res.json({err:{msg:"Transaction token must be included."}})
        }
        let findVerRes = await findAndVerifyOTPToken({ otp });
        if (findVerRes.err) {
            return res.json(findVerRes)
        }
        next()
    } catch (error) {
        console.log(error);
        return res.json({ err: error })
    }
};

module.exports={transactionTokenVerMW}