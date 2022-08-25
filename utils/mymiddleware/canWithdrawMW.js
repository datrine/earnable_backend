const { getBankDetailsByAccountID } = require("../../db/bank_detail");
const { getEmployeeByAccountID } = require("../../db/employee");
const { findAndVerifyToken } = require("../../db/token");
/**
 * @type {import("ng-banks").default}
 */
const ngBank = require("ng-banks");
const { getCompanyByID } = require("../../db/company");
const { getDepartmentByDepartmentID } = require("../../db/department");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let canWithdrawVerMW = async (req, res, next) => {
    try {
        let { amount, withdrawal_fee, } = req.body;

        if (!amount) {
            return res.json({ err: { msg: "Amount to withdraw must be included." } })
        }
        if (!withdrawal_fee) {
            withdrawal_fee = Number(amount) * 0.0015;
            req.body.withdrawal_fee = withdrawal_fee;
        }
        let { accountID } = req.session.account;

        let getEmployeeRes = await getEmployeeByAccountID({ accountID });
        if (getEmployeeRes.err) {
            res.json(getEmployeeRes)
        }
        let employee = getEmployeeRes.employee;
        let department, company, bank_details;
        /* let companyRes = await getCompanyByID({ id: employee.companyID });
         if (companyRes.err) {
             res.json(companyRes)
         }
         let company = companyRes.company
 
         let bankDetailsRes = await getBankDetailsByAccountID({ accountID });
         if (!bankDetailsRes?.bankDetails) {
             res.json(getEmployeeRes)
         }
         let bank_details = bankDetailsRes.bankDetails;
 
         let deptRes = await getDepartmentByDepartmentID({ departmentID: employee.departmentID });
         if (deptRes.err) {
             res.json(companyRes)
         }
         let department = deptRes.department; */

        for await (const promise of [getCompanyByID({ id: employee.companyID }),
        getBankDetailsByAccountID({ accountID }), getDepartmentByDepartmentID({ departmentID: employee.deptID })]) {
            if (promise.err) {
                console.log(promise.err)
                return res.json(promise.err);
            }
            if (promise.company) {
                company = promise.company;
            }
            if (promise.bankDetails) {
                bank_details = promise.bankDetails;
            }
            if (promise.department) {
                department = promise.department
            }

        }

        req.session.employee_details = employee
        req.session.company = company
        req.session.department = department
        req.session.bank_details = {
            acc_number: bank_details.acc_number,
            acc_name: bank_details.acc_name,
            recipient_code: bank_details.recipient_code,
            bankDetailID: bank_details._id.toString()
        }
        next()
    } catch (error) {
        console.log(error);
        return res.json({ err: error })
    }
};

module.exports = { canWithdrawVerMW }