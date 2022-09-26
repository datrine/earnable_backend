const { ObjectId } = require("mongodb");

let bankDetailsTemplate = {
  /**
   * @type {ObjectId}
   */
  _id: undefined,
  acc_name: "Alabi Olutomi",
  bank_name: "UNITED BANK FOR AFRICA",
  bank_code: "033",
  acc_number: "0908900034",
  accountID: "55Jiedm0L4PZOOR6h3qaJ",
  recipient_code: "",
  /**
   * @type {Date}
   */
  lastModified: undefined,
  /**
   * @type {Date}
   */
  createdOn: "",
};

module.exports = bankDetailsTemplate;
