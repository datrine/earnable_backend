const { getBankDetailsByAccountID } = require("../../db/bank_detail");
const { getEmployeeByAccountID } = require("../../db/employee");
/**
 * @type {import("ng-banks").default}
 */
const ngBank = require("ng-banks");
const { getCompanyByID } = require("../../db/company");
const { getDepartmentByDepartmentID } = require("../../db/department");
const { getTransactionByTransactionID } = require("../../db/transaction");

/**
 * 
 * @param {import("express").request} req 
 * @param {import("express").Response} res 
 * @param {function} next 
 */
let canContinueWithdrawMW = async (req, res, next) => {
    try {
        let { amount, withdrawal_fee, } = req.body;
        let { transactionID } = req.session.queried 
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

        for await (const promise of [getCompanyByID({ id: employee.companyID }),
        getBankDetailsByAccountID({ accountID }),
        getDepartmentByDepartmentID({ departmentID: employee.deptID }), getTransactionByTransactionID({ transactionID })]) {
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
            if (promise.transaction) {
                if (promise.transaction.status === "processing") {
                    res.json({ err: { msg: "Transaction already processing..." } })
                }
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

module.exports = { canContinueWithdrawMW }