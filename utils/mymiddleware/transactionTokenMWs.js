const { findAndVerifyToken } = require("../../db/token");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let transactionTokenVerMW= async (req, res, next) => {
    try {
        let transactionToken = req.body;
        if (!transactionToken) {
            return res.json({err:{msg:"Transaction token must be included."}})
        }
        let findVerRes = await findAndVerifyToken({ token: transactionToken });
        if (findVerRes.err) {
            return res.json(findVerRes)
        }
        if (findVerRes.tokenDoc.token_type !== "otp") {
            return res.json({ err: { msg: "Token not appropriate OTP..." } })
        }
        next()
    } catch (error) {
        console.log(error);
        return res.json({ err: error })
    }
};

module.exports={transactionTokenVerMW}