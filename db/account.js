const { mongoClient: clientConn } = require("../utils/conn/mongoConn");
const db = clientConn.db("waleprj");
const accountsCol = db.collection("accounts");
const usersCol = db.collection("users");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../from/utils/email_mgt");
const { createBiodataFunc } = require("./register");
const { accTemplate } = require("./templates");
const { findAndVerifyToken, saveToken } = require("./token");
const { DateTime } = require("luxon");
const { getRandomToken } = require("../from/utils/token_mgt");
const { loginInfo, username } = require("./templates/account");
const { sendPhoneText } = require("../from/utils/phone_mgt");

/**
    * @param {object} params
    * @param {accTemplate} params.account
    * @param {string} params.factor
    * @param {boolean} params.facAuthSuc
    */
async function accountLogOut({ sessID }) {
    try {
        /**
         * @type {accTemplate}
        */
        let accountCheckd = await accountsCol.findOne({
            "loginInfo.current_session.sessID": sessID
        });
        if (!accountCheckd?.loginInfo?.current_session) {
            return { err: { msg: "No account matches sessID...", type: "no_acc" }, state: "failed" }
        }
        let sessExpiresOn = accountCheckd.loginInfo.current_session.expires_on
        if (sessExpiresOn <= new Date()) {
            return { err: { msg: "Session has already expired...", type: "sess_exp" }, state: "sess_expired" }
        }
        let response = await accountsCol.findOneAndUpdate({
            "loginInfo.current_session.sessID": sessID
        }, {
            $set: {
                "loginInfo.current_session": null,
                "loginInfo.logout_time": new Date(),
                "loginInfo.last_login":
                    loginInfo.current_session.completion_time
            }
        }, { returnDocument: "after" });

        let { ok, lastErrorObject, value } = response;
        /**
         * @type {accTemplate}
        */
        let account = value
        if (!account) {
            return { err: { msg: "No account matches sessID..." }, state: "failed" }
        }
        return {
            state: {
                value: "logged_out",
                msg: "Logged out..."
            }
        }
    } catch (error) {
        throw { err: error, state: "failed" }
    }
}

/**
    * @param {object} params
    * @param {accTemplate} params.account
    * @param {string} params.factor
    * @param {boolean} params.facAuthSuc
    */
async function accountAccIDReset({ sessID }) {
    try {
        /**
         * @type {accTemplate}
        */
        let accountCheckd = await accountsCol.findOne({
            "loginInfo.current_session.sessID": sessID
        });
        if (!accountCheckd?.loginInfo?.current_session) {
            return { err: { msg: "No account matches sessID...", type: "no_acc" }, state: "failed" }
        }
        let sessExpiresOn = accountCheckd.loginInfo.current_session.expires_on
        if (sessExpiresOn <= new Date()) {
            return { err: { msg: "Session has expired...", type: "sess_exp" }, state: "sess_expired" }
        }
        let response = await accountsCol.findOneAndUpdate({
            "loginInfo.current_session.sessID": sessID
        }, {
            $set: {
                "loginInfo.current_session.expires_on": DateTime.now().
                    plus({ day: 30 }).toJSDate(),
                //"loginInfo.current_session.sessID": nanoid(),
                "loginInfo.current_session.updatedOn": new Date(),
            }
        }, { returnDocument: "after" });

        let { ok, lastErrorObject, value } = response;
        /**
         * @type {accTemplate}
        */
        let account = value
        if (!account) {
            return { err: { msg: "No account matches sessID..." }, state: "failed" }
        }
        if (!account.loginInfo.current_session.is_ver_complete) {
            let factors_unverified = getUnAuthenticatedFactors(account)
            return {
                state: {
                    value: "pending",
                    msg: "Login authentication pendin...",
                    factors_unverified,
                    sessID: account.loginInfo.current_session.sessID
                }
            }
        }
        let { passHash, ...rest } = account
        return {
            account: rest, state: {
                value: "authenticated",
                msg: "Login full authenticated",
                sessID: account.loginInfo.current_session.sessID
            }
        }
    } catch (error) {
        throw { err: error, state: "failed" }
    }
}

/**
    * @param {object} params
    * @param {accTemplate} params.account
    * @param {"direct"|"mobile"|"email"|"phone_pin"} params.factor
    * @param {boolean} params.facAuthSuc
    */
async function accountPhonePinSet({ account, factor, facAuthSuc = true }) {
    try {
        //write functions to check if account is suspended and if there are other restrictions
        let { loginInfo } = account
        loginInfo.factors = loginInfo.factors || [];
        let is_ver_complete = false;
        if (!loginInfo.current_session) {
            loginInfo.current_session = {}
        }
        if (loginInfo.factors.indexOf("phone_pin") === -1)
            loginInfo.factors = ["phone_pin"]
        //check if other factors have been verified...

        loginInfo.current_session.factors_authenticated = loginInfo.current_session.factors_authenticated || []

        //check if the factor exists
        let factorExists = loginInfo.current_session.factors_authenticated.some((item, index) => item.factor === factor);

        if (!loginInfo.current_session.createdOn)
            loginInfo.current_session.createdOn = new Date();
        //initialize the init_time
        if (!loginInfo.current_session.init_time)
            loginInfo.current_session.init_time = new Date();

        if (!factorExists && facAuthSuc)
            loginInfo.current_session.factors_authenticated.push({ factor, time: new Date() });

        if (!facAuthSuc) {
            let failed_attempts = loginInfo.current_session.failed_attempts
            failed_attempts = Number.isInteger(failed_attempts) ? failed_attempts : 0
            loginInfo.current_session.failed_attempts = failed_attempts + 1;
        }

        let lengthOfVerified = loginInfo.current_session.factors_authenticated.length;
        let lengthOfAllFactors = loginInfo.factors.length;
        //check if all factors are verified
        if (lengthOfAllFactors > lengthOfVerified)
            loginInfo.current_session.is_ver_complete = false;
        else {
            loginInfo.current_session.is_ver_complete = true;
            loginInfo.current_session.completion_time = new Date();
        }

        is_ver_complete = loginInfo.current_session.is_ver_complete

        if (is_ver_complete) {
            if (!loginInfo.current_session.expires_on) {
                loginInfo.current_session.expires_on = DateTime.now().
                    plus({ day: 30 }).toJSDate();
            }
            else {
                let checkPast = new Date() > loginInfo.current_session.expires_on;
                if (checkPast) {
                    loginInfo.current_session.init_time = new Date();
                    loginInfo.current_session.completion_time = undefined;
                    loginInfo.current_session.expires_on = undefined;
                    loginInfo.current_session.failed_attempts = 0;
                    loginInfo.current_session.is_ver_complete = false;
                    loginInfo.current_session.factors_authenticated =
                        [{ factor, time: new Date() }]
                    loginInfo.current_session.sessID = undefined;
                }
            }
        }
        loginInfo.current_session.updatedOn = new Date();
        loginInfo.current_session.sessID = loginInfo.current_session.sessID || nanoid()
        let response = await accountsCol.findOneAndUpdate({ _id: account._id }, {
            $set: {
                loginInfo
            }
        }, { returnDocument: "after" });

        let { ok, lastErrorObject, value } = response;
        /**
            * @type {accTemplate}
            */
        account = value
        let sessID = account.loginInfo.current_session.sessID;
        if (!account.loginInfo.current_session.is_ver_complete) {

            let factors_unverified = getUnAuthenticatedFactors(account)

            return {
                state: {
                    value: "pending",
                    msg: "Login authentication pendin...",
                    factors_unverified,
                    sessID
                }
            }
        }
        let state = {
            value: "authenticated",
            msg: "Login fully authenticated", sessID
        }
        let { passHash, ...rest } = account
        return { account: rest, state }
    } catch (error) {
        throw { err: error, state: "failed" }
    }
}

/**
    * @param {object} params
    * @param {accTemplate} params.account
    * @param {"direct"|"mobile"|"email"|"phone_pin"} params.factor
    * @param {boolean} params.facAuthSuc
    */
async function accountSet({ account, factor, facAuthSuc = true }) {
    try {
        //write functions to check if account is suspended and if there are other restrictions
        let { loginInfo } = account
        loginInfo.factors = loginInfo.factors || [];
        let is_ver_complete = false;
        if (!loginInfo.current_session) {
            loginInfo.current_session = {}
        }
        if (loginInfo.factors.indexOf("direct") === -1)
            loginInfo.factors = ["direct", "email", "mobile", "phone_pin"]
        //check if other factors have been verified...

        loginInfo.current_session.factors_authenticated = loginInfo.current_session.factors_authenticated || []

        //check if the factor exists
        let factorExists = loginInfo.current_session.factors_authenticated.some((item, index) => item.factor === factor);

        if (!loginInfo.current_session.createdOn)
            loginInfo.current_session.createdOn = new Date();
        //initialize the init_time
        if (!loginInfo.current_session.init_time)
            loginInfo.current_session.init_time = new Date();

        if (!factorExists && facAuthSuc)
            loginInfo.current_session.factors_authenticated.push({ factor, time: new Date() });

        if (!facAuthSuc) {
            let failed_attempts = loginInfo.current_session.failed_attempts
            failed_attempts = Number.isInteger(failed_attempts) ? failed_attempts : 0
            loginInfo.current_session.failed_attempts = failed_attempts + 1;
        }

        let lengthOfVerified = loginInfo.current_session.factors_authenticated.length;
        let lengthOfAllFactors = loginInfo.factors.length;
        //check if all factors are verified
        if (lengthOfAllFactors > lengthOfVerified)
            loginInfo.current_session.is_ver_complete = false;
        else {
            loginInfo.current_session.is_ver_complete = true;
            loginInfo.current_session.completion_time = new Date();
        }

        is_ver_complete = loginInfo.current_session.is_ver_complete

        if (is_ver_complete) {
            if (!loginInfo.current_session.expires_on) {
                loginInfo.current_session.expires_on = DateTime.now().
                    plus({ day: 30 }).toJSDate();
            }
            else {
                let checkPast = new Date() > loginInfo.current_session.expires_on;
                if (checkPast) {
                    loginInfo.current_session.init_time = new Date();
                    loginInfo.current_session.completion_time = undefined;
                    loginInfo.current_session.expires_on = undefined;
                    loginInfo.current_session.failed_attempts = 0;
                    loginInfo.current_session.is_ver_complete = false;
                    loginInfo.current_session.factors_authenticated =
                        [{ factor, time: new Date() }]
                    loginInfo.current_session.sessID = undefined;
                }
            }
        }
        loginInfo.current_session.updatedOn = new Date();
        loginInfo.current_session.sessID = loginInfo.current_session.sessID || nanoid()
        let response = await accountsCol.findOneAndUpdate({ _id: account._id }, {
            $set: {
                loginInfo
            }
        }, { returnDocument: "after" });

        let { ok, lastErrorObject, value } = response;
        /**
            * @type {accTemplate}
            */
        account = value
        let sessID = account.loginInfo.current_session.sessID;
        if (!account.loginInfo.current_session.is_ver_complete) {

            let factors_unauthenticated = getUnAuthenticatedFactors(account);
            let factors_unverified = getUnverifiedFactors(account);
            if (!!factors_unauthenticated.length) {
                let verSessID = account.verInfo.verSessID
                return {
                    state: {
                        value: "pending",
                        msg: "Login authentication pendin...",
                        factors_unauthenticated,
                        factors_unverified,
                        sessID,
                        verSessID
                    }
                }
            }
            return {
                state: {
                    value: "pending",
                    msg: "Login authentication pendin...",
                    factors_unverified,
                    factors_unauthenticated,
                    sessID,
                }
            }
        }
        let state = {
            value: "authenticated",
            msg: "Login fully authenticated", sessID
        }
        let { passHash, ...rest } = account
        return { account: rest, state }
    } catch (error) {
        throw { err: error, state: "failed" }
    }
}

async function emailFactorAuth({ email, token }) {
    try {
        if (!token) {
            return { err: { msg: "Token not supplied..." }, state: "failed" }
        }
        let { err: tokenErr, tokenDoc } = await findAndVerifyToken({ token });
        if (tokenErr) {
            return { err: tokenErr, state: "failed" }
        }
        if (tokenDoc.type !== "token_auth") {
            return { err: { msg: "Wrong token access" }, state: "failed" }
        }
        let { err, account, state } = await emailFactorDBUpdate(tokenDoc.factorValue);
        if (err) {
            return { err, state: "failed" }
        }
        if (state.value != "authenticated") {
            return { state }
        }
        return { account, state }
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function emailFactorDBUpdate(email) {
    try {
        if (!email) {
            return { err: { msg: "Email not supplied..." } }
        }
        /**
         * @type {accTemplate}
         */
        let accountBeforeSetup = await accountsCol.findOne({
            email,
        });

        if (!accountBeforeSetup) {
            return { err: { msg: "Email token failed..." } };
        }

        //accountBeforeSetup.loginInfo.current_session.factors_authenticated.
        let response = await accountSet({
            account: accountBeforeSetup,
            factor: "email", facAuthSuc: true
        });
        let { err, state, account } = response;
        if (err)
            return { err }
        if (state.value != "authenticated")
            return { state }
        return { account, state }
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function mobileFactorAuth({ email, token }) {
    try {
        if (!token) {
            return { err: { msg: "Token not supplied..." }, state: "failed" }
        }
        let { err: tokenErr, tokenDoc } = await findAndVerifyToken({ token });
        if (tokenErr) {
            return { err: tokenErr, state: "failed" }
        }
        if (tokenDoc.type !== "token_auth") {
            return { err: { msg: "Wrong token access" }, state: "failed" }
        }
        let { err, account, state } = await mobileFactorDBUpdate(tokenDoc.factorValue);
        if (err) {
            return { err, state: "failed" }
        }
        if (state.value != "authenticated") {
            return { state }
        }
        return { account, state }
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function mobileFactorDBUpdate(phonenum) {
    try {
        if (!phonenum) {
            return { err: { msg: "Mobile not supplied..." } }
        }
        /**
         * @type {accTemplate}
         */
        let accountBeforeSetup = await accountsCol.findOne({
            phonenum,
        });

        if (!accountBeforeSetup) {
            return { err: { msg: "Phone number not found. token failed..." } };
        }

        //accountBeforeSetup.loginInfo.current_session.factors_authenticated.
        let response = await accountSet({
            account: accountBeforeSetup,
            factor: "mobile", facAuthSuc: true
        });
        let { err, state, account } = response;
        if (err)
            return { err }
        if (state.value != "authenticated")
            return { state }
        return { account, state }
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function setDefaultPhonePin({ phonenum, phonePin, }) {
    try {
        if (!phonenum) {
            return { err: { msg: "Mobile not supplied..." } }
        }
        if (!phonePin) {
            return { err: { msg: "Pin not supplied..." } }
        }
        let accRes = await accountsCol.findOneAndUpdate({
            phonenum,
        }, { $set: { phonePin } }, { returnDocument: "after" });
        /**
         * @type {accTemplate}
         */
        let acc = accRes.value;
        if (!accRes) {
            return { err: { msg: "Phone number not found. token failed..." } };
        }
        let accSetRes = await accountPhonePinSet({ account: acc, factor: "phone_pin", facAuthSuc: false });
        return accSetRes;
    } catch (error) {
        console.log(error);
        throw error
    }
}

async function changePhonePin({ phonenum, oldPin, phonePin, sessID }) {
    try {
        if (!phonenum) {
            return { err: { msg: "Mobile not supplied..." } }
        }
        if (!phonePin) {
            return { err: { msg: "Pin not supplied..." } }
        }
        /**
         * @type {accTemplate}
         */
        let accToEdit = await accountsCol.findOne({
            phonenum,
        });
        if (!accToEdit) {
            return { err: { msg: "Phone number not found..." } };
        }
        if (accToEdit.phonePin === phonePin) {
            return { err: { msg: "Pin already exists..." } };
        }
        let accRes = await accountsCol.findOneAndUpdate({
            phonenum,
        }, { $set: { phonePin } }, { returnDocument: "after" });
        /**
         * @type {accTemplate}
         */
        if (!accRes) {
            return { err: { msg: "Phone number not found. token failed..." } };
        }
        let accResetRes = await accountAccIDReset({ sessID });
        return accResetRes;


    } catch (error) {
        console.log(error);
        throw error
    }
}

async function directPhonePinAuth({ phonenum, pin }) {
    try {
        if (!phonenum) {
            return { err: { msg: "Phone number not supplied..." } }
        }
        if (!pin) {
            return { err: { msg: "Pin not supplied..." } }
        }
        let { err, account, state } = await phonePinLoginDBUpdate({ phonenum, pin });
        if (err)
            return { err }

        if (state.value != "authenticated")
            return { state }

        if (!account.accountID) {
            return { error: { msg: "Unable to complete account creation..." } }
        }
        return { account, state }
    } catch (error) {
        console.log(error);
        throw { err: error }
    }
}

async function directFactorAuth({ identifier, password }) {
    try {
        if (!identifier) {
            return { err: { msg: "Email/username/phonenum not supplied..." } }
        }
        if (!password) {
            return { err: { msg: "Password not supplied..." } }
        }
        let { err, account, state } = await directFactorDBUpdate({ identifier, password });
        if (err)
            return { err }

        if (state.value != "authenticated")
            return { state }

        if (!account.accountID) {
            return { error: { msg: "Unable to complete account creation..." } }
        }
        return { account, state }
    } catch (error) {
        console.log(error);
        throw { err: error }
    }
}

async function phonePinLoginDBUpdate({ phonenum, pin }) {
    try {
        /**
         * @type {accTemplate}
         */
        let accountBeforeSetup = await accountsCol.findOne({
            phonenum,
        });

        if (!accountBeforeSetup) {
            return { err: { msg: "Phone number does not exist in record..." } };
        }
        let pinMatches = String(accountBeforeSetup.phonePin) === String(pin);
        if (!pinMatches) {
            //accountBeforeSetup.loginInfo.current_session.factors_authenticated.
            let response = await accountPhonePinSet({
                account: accountBeforeSetup,
                factor: "phone_pin", facAuthSuc: false
            });
            let { err, account } = response;
            return { err: { msg: "Wrong password..." } };
        }
        //accountBeforeSetup.loginInfo.current_session.factors_authenticated.
        let response = await accountPhonePinSet({ account: accountBeforeSetup, factor: "phone_pin", facAuthSuc: true });
        let { err, state, account } = response;
        if (err)
            return { err }
        if (state.value != "authenticated")
            return { state }
        return { account, state }
    } catch (error) {
        console.log(error)
    }
}

async function directFactorDBUpdate(directCreds) {
    try {
        let { identifier, password } = directCreds;

        /**
         * @type {accTemplate}
         */
        let accountBeforeSetup = await accountsCol.findOne({
            $or: [{ email: identifier, },
            { phonenum: identifier, },
            { username: identifier, }],
        });

        if (!accountBeforeSetup) {
            return { err: { msg: "Email/phone number does not exist in record..." } };
        }

        let matches = await bcrypt.compare(password, accountBeforeSetup.passHash);
        if (!matches) {
            //accountBeforeSetup.loginInfo.current_session.factors_authenticated.
            let response = await accountSet({
                account: accountBeforeSetup,
                factor: "direct", facAuthSuc: false
            });
            let { err, account } = response;
            return { err: { msg: "Wrong password..." } };
        }
        //accountBeforeSetup.loginInfo.current_session.factors_authenticated.
        let response = await accountSet({ account: accountBeforeSetup, factor: "direct" });
        let { err, state, account } = response;
        if (err)
            return { err }
        if (state.value != "authenticated")
            return { state }
        return { account, state }
    } catch (error) {
        console.log(error)
    }
}

async function retrieveAccountInfoBasic({ identifier }) {
    try {
        /**
         * @type {accTemplate}
         */
        let account = await accountsCol.findOne({
            $or: [{ email: identifier, },
            { phonenum: identifier, },
            { username: identifier, },
            { accountID: identifier, }],
        });
        if (!account) {
            return { err: { msg: "Email/phone number does not exist in record..." } };
        }
        return { account }
    } catch (error) {
        console.log(error)
    }
}

async function retrieveAccountInfoFunc(directCreds) {
    try {
        let { identifier, password } = directCreds;
        /**
         * @type {accTemplate}
         */
        let account = await accountsCol.findOne({
            $or: [{ email: identifier, },
            { phonenum: identifier, },
            { username: identifier, }],
        });
        if (!account) {
            return { err: { msg: "Email/phone number does not exist in record..." } };
        }
        let matches = await bcrypt.compare(password, account.passHash);
        if (!matches) {
            return { err: { msg: "Wrong password..." } };
        }
        return { account }
    } catch (error) {
        console.log(error)
    }
}

async function getBiodataFunc({ email, accountID }) {
    try {
        let user = await usersCol.findOne({
            $or: [{ email }, { accountID }]
        });
        if (!user) {
            user = await createBiodataFunc({ email, accountID })
        }
        return { user }
    } catch (error) {
        console.log(error);
    }
}

async function retrieveAccountInfoBySessID(sessID) {
    try {
        /**
         * @type {accTemplate}
         */
        let account = await accountsCol.findOne({
            "loginInfo.current_session.sessID": sessID
        });
        if (!account) {
            return { err: { msg: "SessID does not exist in record..." } };
        }
        let { passHash, ...rest } = account
        return { account: rest }
    } catch (error) {
        console.log(error)
    }
}

async function activateEmployeeAccount({ identifier, verSessID, phonePin }) {
    try {
        /**
         * @type {accTemplate}
         */
        let account = await accountsCol.findOne({
           $or:[{phonenum:identifier},{username:identifier}] 
        });
        if (!account) {
            return { err: { msg: "Account does not exist." } };
        }

        if (account.acc_type !== "employee") {
            return { err: { msg: "Account isn't an Employee type." } };
        }

        if (!phonePin) {
            return { err: { msg: "New pin required to activate." } };
        }

        if (account?.verInfo?.verSessID !== verSessID) {
            return { err: { msg: "Account verification session ID does not match record." } };
        }

        account.phonePin = phonePin
        let current_activity = account.activity.current;
        current_activity.to = new Date()
        account.activity.history.push(current_activity);
        account.activity.current = { name: "active", from: new Date() };
        account.updatedOn = new Date();
        let result = await accountsCol.findOneAndUpdate({  $or:[{phonenum:identifier},{username:identifier}] },
             { $set: { ...account } });

        if (!result.ok) {
            return { err: { msg: "Account activation failed." } };
        }
        return { info: "Account is activated." }
    } catch (error) {
        console.log(error);
        throw { err: error }
    }
}

async function getCurrentAccountActivity({ identifier }) {
    try {
        
        /**
         * @type {accTemplate}
         */
        let account = await accountsCol.findOne({
          $or:[{phonenum: identifier,},{email:identifier}]  
        });
        console.log(identifier)
        if (!account) {
            return { err: { msg: "Account does not exist." } };
        }
        console.log(account)
        return { activity: account?.activity?.current?.name };

    } catch (error) {
        console.log(error);
        throw { err: error }
    }
}

async function checkIfAccountPropExists({ prop, value }) {
    try {
        /**
         * @type {accTemplate}
         */
        let account = await accountsCol.findOne({
            [prop]: value
        });
        if (!account) {
            return { exists: false };
        }
        return { exists: true }
    } catch (error) {
        console.log(error)
    }
}

async function retrieveAccountInfoByVerSessID(verSessID) {
    try {
        /**
         * @type {accTemplate}
         */
        let account = await accountsCol.findOne({
            "verInfo.verSessID": verSessID
        });
        if (!account) {
            return { err: { msg: "verSessID does not exist in record..." } };
        }
        return { account }
    } catch (error) {
        console.log(error)
    }
}

/**
 * 
 * @param {object} param0 
 * @param {string} param0.verSessID
 * @param {"email"|"mobile"|"phone_pin"} param0.factor
 * @param {boolean} param0.isVerified
 * @param {boolean} param0.tokenSent
 * @param {"start"|"update"} param0.mode
 * @returns 
 */
async function updateAccVer({ verSessID, tokenSent, factor, isVerified, mode = "start" }) {
    try {
        /**
         * @type {accTemplate}
         */
        let account = await accountsCol.findOne({
            "verInfo.verSessID": verSessID
        });

        if (!account) {
            return { err: { msg: "verSessID does not exist in record..." } };
        }

        let { verInfo } = account
        //find factor
        let verFactorObj =
            verInfo.status.find(obj => obj.factor === factor);
        if (verFactorObj) {
            verFactorObj.isVerified = isVerified;
            if (verFactorObj.tokenSent) {
                //return { err: { msg: "Token already sent...",type:"token_sent" } };
            }
            if (mode === "start") {
                verFactorObj.timeInitiatized = new Date()
            }
            if (tokenSent) {
                verFactorObj.tokenSent = tokenSent
            }
            verFactorObj.timeVerified =
                verFactorObj.isVerified ? new Date() : null
        }
        let indexOfObj = verInfo.status.findIndex(obj => obj.factor === factor);
        if (indexOfObj !== -1) {
            verInfo.status.splice(indexOfObj, 1, verFactorObj)
        }
        let updateRes = await accountsCol.findOneAndUpdate({
            "verInfo.verSessID": verSessID
        }, {
            $set: { "verInfo.status": verInfo.status }
        })
        let { ok, lastErrorObject, value } = updateRes
        return { info: "Account verification updated..." }
    } catch (error) {
        console.log(error)
    }
}

async function activateNext({ factorToActivate, account }) {
    try {
        switch (factorToActivate) {
            case "email": {
                let tokenObj = {}
                let token = getRandomToken({ minLength: 6 })
                tokenObj.token = token;
                tokenObj.factorValue = account.email;
                tokenObj.factor = "email";
                tokenObj.type = "token_auth"
                tokenObj.ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
                let msg = `Token to input: ${token}`
                let emailRes = await sendEmail({
                    to: account.email,
                    subject: "Email Token Authentication",
                    html: msg
                });
                await saveToken(tokenObj)
                return emailRes
            }

            case "mobile": {
                let tokenObj = {}
                let token = getRandomToken({ minLength: 4 })
                tokenObj.token = token;
                tokenObj.factorValue = account.phonenum;
                tokenObj.factor = "mobile";
                tokenObj.type = "token_auth";
                tokenObj.ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
                let msg = `Token to input: ${token}`
                let smsRes = await sendPhoneText({
                    to: account.phonenum,
                    text: msg
                })
                await saveToken(tokenObj)
                return smsRes
            }

            case "phone_pin": {
                let tokenObj = {}
                let token = getRandomToken({ minLength: 4 })
                tokenObj.token = token;
                tokenObj.factorValue = account.phonenum;
                tokenObj.factor = "phone_pin";
                tokenObj.type = "token_auth";
                tokenObj.ttl = DateTime.now().plus({ minute: 10 }).toJSDate()
                let msg = `Token to input: ${token}`
                let smsRes = await sendPhoneText({
                    to: account.phonenum,
                    text: msg
                })
                await saveToken(tokenObj)
                return smsRes
            }
            default:
                break;
        }
    } catch (error) {
        console.log(error);
        throw { err: error }
    }
}

/**
           * 
           * @param {accTemplate} account 
           * @returns 
           */
let getUnAuthenticatedFactors = (account) => account.loginInfo.factors.filter(factor => {
    return !account.loginInfo?.current_session?.
        factors_authenticated?.some(elem => elem.factor === factor)
});

/**
           * 
           * @param {accTemplate} account 
           * @returns 
           */
let getUnverifiedFactors = (account) => account.verInfo.status.filter(factor => !factor.isVerified);

let retrieveAccountInfoByAccountID = async (accountID) => {
    let res = await retrieveAccountInfoBasic({ identifier: accountID });
    if (res.err) {
        return { msg: "No accountID matches the one supplied..." }
    }
}

/**
 * 
 * @param {object} opts 
 * @param {string} opts.search_string 
 * @param {"deep"|"shallow"} opts.search_mode
 * @param {number} opts.limit
 * @returns 
 */
let deepSearchAccountsAndUsers = async ({ search_string, ...filter }) => {
    let searchPool = []
    let accountsCursor = await accountsCol.find({
        $or: [{ email: { $regex: search_string }, },
        { phonenum: { $regex: search_string }, },
        { username: { $regex: search_string }, },
        { accountID: { $regex: search_string }, }],
    });
    let accResultArray = await accountsCursor.toArray();
    let usersCursor = await usersCol.find({
        $or: [{ email: { $regex: search_string }, },
        { phonenum: { $regex: search_string }, },
        { username: { $regex: search_string }, },
        { accountID: { $regex: search_string }, }],
    });
    if (filter.search_mode === "deep") {
        let userResultArray = await usersCursor.toArray();
        for await (const user of userResultArray) {
            let acc = await usersCol.findOne({ accountID: user.accountID, });
            accResultArray.push(acc);
        }
    }
    let map = new Map();
    accResultArray.forEach(doc => {
        map.set(doc.accountID, doc)
    });
    searchPool = [...map.values()];
    return { accounts: searchPool }
}

module.exports = {
    emailFactorAuth,
    emailFactorDBUpdate,
    mobileFactorAuth,
    mobileFactorDBUpdate,
    directFactorAuth, directPhonePinAuth,
    directFactorDBUpdate,
    retrieveAccountInfoFunc,
    getBiodataFunc,
    accountAccIDResetSet: accountAccIDReset,
    retrieveAccountInfoBySessID,
    retrieveAccountInfoBasic,
    retrieveAccountInfoByVerSessID,
    activateNext, updateAccVer,
    getUnAuthenticatedFactors, accountLogOut,
    retrieveAccountInfoByAccountID,
    deepSearchAccountsAndUsers, changePhonePin,
    setDefaultPhonePin, checkIfAccountPropExists,
    activateEmployeeAccount, getCurrentAccountActivity
};