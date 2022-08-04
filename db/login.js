const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const accountsCol = db.collection("accounts");
const usersCol = db.collection("users");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../from/utils/email_mgt");
const { createBiodataFunc } = require("./register");
const { accTemplate } = require("./templates");
const { directFactorAuth, emailFactorAuth, mobileFactorAuth, directPhonePinAuth } = require("./account");

async function directLoginFunc(data) {
    try {
        let { err, account, state } =  await directFactorAuth(data)
        if (err) {
            return { err }
        }
        if (state.value != "authenticated") {
            return { state }
        }
        if (!account.accountID) {
            return { err: { msg: "Account not valid..." } }
        }
        /**  let { user } = await getBiodataFund({
              email, accountID: account.accountID,
              lastname, firstname, dob, gender
          }); */
        return { account, state }
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function emailLoginFunc(data) {
    try {
        let { err, account, user, state } = //await retrieveAccountInfoFunc({ identifier, password });
            await emailFactorAuth(data)
        if (err) {
            return { err }
        }
        if (state.value != "authenticated") {
            return { state }
        }
        if (!account.accountID) {
            return { err: { msg: "Account not valid..." } }
        }
        if (account.loginInfo.current_session.expires_on < new Date()) {
            return { err: { msg: "Current session has expired..." } }
        }
        /**  let { user } = await getBiodataFund({
              email, accountID: account.accountID,
              lastname, firstname, dob, gender
          }); */
        return { account, user, state }
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function mobileSMSLoginFunc(data) {
    try {
        let { err, account, user, state } = //await retrieveAccountInfoFunc({ identifier, password });
            await mobileFactorAuth(data)
        if (err) {
            return { err }
        }
        if (state.value != "authenticated") {
            return { state }
        }
        if (!account.accountID) {
            return { err: { msg: "Account not valid..." } }
        }
        if (account.loginInfo.current_session.expires_on < new Date()) {
            return { err: { msg: "Current session has expired..." } }
        }
        /**  let { user } = await getBiodataFund({
              email, accountID: account.accountID,
              lastname, firstname, dob, gender
          }); */
        return { account, user, state }
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function retrieveAccountInfoFunc(accToSave) {
    try {
        let { identifier, password } = accToSave;
        /**
         * @type {accTemplate}
         */
        let account = await accountsCol.findOne({
            $or: [{ email: identifier, },
            { phonenum: identifier, },
            { username: identifier, }],
        });
        if (!account) {
            console.log("Email/phone number does not exist in record...")
            return { err: "Email/phone number does not exist in record..." };
        }
        let matches = await bcrypt.compare(password, account.passHash);
        if (!matches) {
            console.log("Wrong password...");
            return { err: "Wrong password..." };
        }
        return { account }
    } catch (error) {
        console.log(error)
    }
}

async function directMobilePinLoginFunc(data) {
    try {
        let { err, account, state } =  await directPhonePinAuth(data)
        if (err) {
            return { err }
        }
        if (state.value != "authenticated") {
            return { state }
        }
        if (!account.accountID) {
            return { err: { msg: "Account not valid..." } }
        }
        /**  let { user } = await getBiodataFund({
              email, accountID: account.accountID,
              lastname, firstname, dob, gender
          }); */
        return { account, state }
    } catch (error) {
        console.log(error);
        throw error
    }
}

module.exports = { directLoginFunc, emailLoginFunc, 
    retrieveAccountInfoFunc, mobileSMSLoginFunc,directMobilePinLoginFunc};