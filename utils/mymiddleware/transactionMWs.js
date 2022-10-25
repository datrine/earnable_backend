const { DateTime } = require("luxon");
const { getEmployeeFlexibleAccess } = require("../../db/employee");
const { getEmployeeWithdrawalHistory } = require("../../db/withdrawal");

/**
 *
 * @param {import("express").request} req
 * @param {import("express").Response} res
 * @param {function} next
 */
let resolveTransactionMW = async (req, res, next) => {
  try {
    let {
      employee_details,
      amount: amountRequestedToWithdraw,bank_details,company:{salaryMonthID,salaryYearID}
    } = req.session.queried;
    let { flexible_access, err: flexibleAccessErr } =
      await getEmployeeFlexibleAccess({
        filters: { employeeID: employee_details.employeeID },
      });
    if (flexibleAccessErr) {
      return res.json({ flexibleAccessErr });
    }

    let withdrawal_charge_mode = flexible_access.access_mode;
    let employeeID = employee_details?.employeeID;

    let resolvedWithdrawAccess = flexible_access.access_value;
    let resWiHx = await getEmployeeWithdrawalHistory({
      employeeID,
      filters: {
        salaryMonthID,salaryYearID,
        states: ["initiated", "processing", "completed"],
      },
    });
    let totalAmountWithdrawnOrEarmarked = resWiHx.withdrawal_history
      .filter(
        ({ status }) =>
          status.name === "initiated" ||
          status.name === "processing" ||
          status.name === "completed"
      )
      .reduce((prev, cur) => {
        let sum =
          prev +
          Number(
            cur.transactionInfo?.netAmountToWithdraw +
              cur.transactionInfo?.withdrawal_fee_by_employer
          );
        console.log({ sum });
        return sum;
      }, 0);

    let grossMaxAmountWithdrawable =
      (Number(employee_details.monthly_salary) *
        Number(resolvedWithdrawAccess)) /
      100;

    let netMaxAmountWithdrawable = Math.max(
      0,
      grossMaxAmountWithdrawable - totalAmountWithdrawnOrEarmarked
    );
    let grossAmountToWithdraw = Math.min(
      netMaxAmountWithdrawable,
      amountRequestedToWithdraw
    );
    let withdrawal_fee = grossAmountToWithdraw * 0.015;
    let netAmountToWithdraw = 0;
    let withdrawal_fee_by_employee = 0;
    let withdrawal_fee_by_employer = 0;
    //withdrawal_charge_mode="shared"
    if (withdrawal_charge_mode === "employee") {
      netAmountToWithdraw = grossAmountToWithdraw - withdrawal_fee;
      withdrawal_fee_by_employee = withdrawal_fee;
    }
    if (withdrawal_charge_mode === "shared") {
      netAmountToWithdraw = grossAmountToWithdraw - withdrawal_fee / 2;
      withdrawal_fee_by_employee = withdrawal_fee / 2;
      withdrawal_fee_by_employer = withdrawal_fee / 2;
    }
    if (withdrawal_charge_mode === "employer") {
      netAmountToWithdraw = grossAmountToWithdraw;
      withdrawal_fee_by_employer = withdrawal_fee;
    }
    let amountDeductible = grossAmountToWithdraw - netAmountToWithdraw;
    if (netMaxAmountWithdrawable <= 0) {
      return res.json({ err: { msg: "Flexible salary limits reached" } });
    }
    
    let transactionInfo = {
      amountRequestedToWithdraw,
      resolvedWithdrawAccess,
      totalAmountWithdrawnOrEarmarked,
      withdrawal_fee,
      withdrawal_charge_mode,
      withdrawal_fee_by_employee,
      withdrawal_fee_by_employer,
      amountDeductible,
      grossMaxAmountWithdrawable,
      netMaxAmountWithdrawable,
      grossAmountToWithdraw,
      netAmountToWithdraw,
      ...bank_details
    };
    console.log({bank_details})
    req.session.queried = { ...req.session.queried, transactionInfo };
    next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = { resolveTransactionMW };
