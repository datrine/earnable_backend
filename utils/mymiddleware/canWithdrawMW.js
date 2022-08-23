const { getBankDetailsByAccountID } = require("../../db/bank_detail");
const { getEmployeeByAccountID } = require("../../db/employee");
const { findAndVerifyToken } = require("../../db/token");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let canWithdrawVerMW = async (req, res, next) => {
    try {
        let { transactionToken, bank_code, amount, withdrawal_fee, bank_name, timestamp_started } = req.body;

        if (!transactionToken) {
            return res.json({ err: { msg: "Transaction token must be included." } })
        }
        if (!amount) {
            return res.json({ err: { msg: "Amount to withdraw must be included." } })
        }
        if (!withdrawal_fee) {
            withdrawal_fee = Number(amount) * 0.0015;
            req.body.withdrawal_fee = withdrawal_fee;
        }
        let { accountID } = req.session.account;
        let getEmployeeRes=await getEmployeeByAccountID({accountID});
       let employee= getEmployeeRes.employee;
       
        req.session.employee_details=employee
        next()
    } catch (error) {
        console.log(error);
        return res.json({ err: error })
    }
};

module.exports = { canWithdrawVerMW }