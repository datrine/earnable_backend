const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const accountsCol = db.collection("accounts");
const walletsCol = db.collection("wallets");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../from/utils/email_mgt");
const { createBiodataFunc } = require("./register");
const { accTemplate } = require("./templates");
const { findAndVerifyToken, saveToken } = require("./token");
const { DateTime } = require("luxon");
const { getRandomToken } = require("../from/utils/token_mgt");
const { loginInfo } = require("./templates/account");
const { sendPhoneText } = require("../from/utils/phone_mgt");

let getWalletByCompanyID = async (companyID) => {
    let wallet = await walletsCol.findOne({
        companyID
    })
}

let createCompanyWallet = async ({ companyID }) => {
    let wallet = await walletsCol.insertOne({
        companyID
    })
}
module.exports = { getWalletByCompanyID,createCompanyWallet }