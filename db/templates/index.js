const accTemplate = require("./account");
const bankDetailsTemplate = require("./bankDetails");
const {
  calculationItemTemplate,
  accumulationsTemplate,payrollTemplate
} = require("./calculations");
const contactsTemplate = require("./contacts");
const employeeTemplate = require("./employee");
const keyTemplate = require("./keys");

module.exports = {
  accTemplate,
  contactsTemplate,
  keyTemplate,
  employeeTemplate,
  bankDetailsTemplate,
  calculationItemTemplate,
  accumulationsTemplate,payrollTemplate
};
