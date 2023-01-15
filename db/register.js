const { mongoClient } = require("../utils/conn/mongoConn");
const DB_NAME=process.env.DB_NAME
const db = mongoClient.db(DB_NAME);
const accountsCol = db.collection("accounts");
const usersCol = db.collection("users");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const { accTemplate } = require("./templates");
const { processImg } = require("../from/utils/processMedia");
const { addEmployee } = require("./employee");
/**
 * @type {import("ng-banks").default}
 */
const ngBank = require("ng-banks");
const {
  addBankDetail,
  updateRecieptCodeEmployeeID,
  createRecipientCode,
} = require("./bank_detail");
/**
 * @type {import("isomorphic-unfetch").default}
 */
const fetch = require("isomorphic-unfetch");

async function registerFunc(data) {
  try {
    let {
      email,
      username,
      phonenum,
      password,
      f_name,
      l_name,
      dob,
      gender,
      ...rest
    } = data;
    if (!email) {
      return { err: { msg: "Email not supplied..." } };
    }
    if (!username) {
      return { err: { msg: "Username not supplied..." } };
    }
    if (!phonenum) {
      return { err: { msg: "Phone number not supplied..." } };
    }
    if (!password) {
      return { err: { msg: "Password not supplied..." } };
    }

    let passHash = await bcrypt.hash(password, 10);
    let accountRes = await createAccountFunc({
      email,
      username,
      phonenum,
      passHash,
    });

    if (accountRes.err) {
      return { err: accountRes.err };
    }
    if (!accountRes.accountID) {
      return { err: { msg: "Unable to complete account creation..." } };
    }

    let userRes = await createBiodataFunc({
      email,
      accountID: accountRes.accountID,
      l_name,
      f_name,
      dob,
      gender,
      ...rest,
    });
    return { ...accountRes };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function registerEmployeeFunc(data) {
  try {
    let {
      email,
      username,
      phonenum,
      job_title,
      monthly_salary,
      phonePin,
      companyIssuedEmployeeID,
      f_name,
      l_name,
      dob,
      gender,
      companyID,
      bank_name,
      acc_number,
      bank_code,
      deptID,
      department,
      enroll,
    } = data;
    username = username || email;
    if (!email) {
       return { err: { msg: "Email not supplied..." } }
    }
    if (!username) {
       return { err: { msg: "Username not supplied..." } }
    }
    if (!l_name) {
       return { err: { msg: "Last name not supplied..." } }
    }
    if (!f_name) {
       return { err: { msg: "First name not supplied..." } }
    }
    if (!phonenum) {
      return { err: { msg: "Phone number not supplied..." } };
    }
    if (!deptID) {
      return { err: { msg: "Department not supplied..." } }
    }
    if (!phonePin) {
      //return { err: { msg: "Password not supplied..." } }
    }
    //let passHash = await bcrypt.hash(phonePin, 10);
    let accountRes = await createEmployeeAccountFunc({
      email,
      username,
      phonenum,
      phonePin,
    });

    if (accountRes.err) {
      return accountRes;
    }
    if (!accountRes.accountID) {
      return { err: { msg: "Unable to complete account creation..." } };
    }

    let userRes = await createBiodataFunc({
      email,
      accountID: accountRes.accountID,
      l_name,
      f_name,
      dob,
      gender,
    });
    let enrollment_state = {
      state: enroll ? "pending" : "unenrolled",
      createdOn: new Date(),
    };
    let addEmployeeRes = await addEmployee({
      accountID: accountRes.accountID,
      companyID,
      job_title,
      monthly_salary,
      deptID,
      department,
      companyIssuedEmployeeID,
      enrollment_state,
      lastModified: new Date(),
      createdOn: new Date(),
    });

    if (addEmployeeRes.err) {
      return addEmployeeRes;
    }
    let bankDetailRes;
    if (bank_name && bank_code && acc_number) {
      let det = {
        acc_name: l_name + " " + f_name,
        bank_name: ngBank.getBank(bank_code).name,
        bank_code,
        acc_number,
        accountID: accountRes.accountID,
      };
      bankDetailRes = await addBankDetail({ ...det });
    }

    if (bankDetailRes?.err) {
      return bankDetailRes;
    }
    let bankDetailID = bankDetailRes?.bankDetailID;
    (async () => {
      try {
        let { err: recipientCodeErr, recipient_code } =
          await createRecipientCode({
            l_name,
            f_name,
            acc_number,
            bank_code,
            bankDetailID,
          });
        if (recipientCodeErr) {
          return { err: recipientCodeErr };
        }
        let { err, info } = await updateRecieptCodeEmployeeID({
          bankDetailID,
          recipient_code,
        });
        if (err) {
          console.log(err);
          return { err };
        }
        if (info) {
          console.log(info);
        }
      } catch (error) {
        console.log(error);
      }
    })();
    return { ...accountRes, ...userRes, ...addEmployeeRes, ...bankDetailRes };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function createAccountFunc(dataToSave) {
  try {
    let { email, username, phonenum, prof_pic, passHash } = dataToSave;
    let accountID = nanoid();
    let docExists = await accountsCol.findOne({
      $or: [{ email }, { username }, { phonenum }],
    });
    if (docExists) {
      if (docExists.email === email) {
        return { err: { msg: "Email already exists..." } };
      }
      if (docExists.username === username) {
        return { err: { msg: "Username already exists..." } };
      }
      if (docExists.phonenum === phonenum) {
        return { err: { msg: "Phone number already exists..." } };
      }
    }
    /**
     * @type {accTemplate}
     */
    let accToSave = {
      email,
      accountID,
      phonenum,
      username,
      passHash,
      loginInfo: {
        first_login: null,
        last_login: null,
        num_of_failed_logins: 0,
        factors: ["direct", "email"],
        enforce_all: true,
        enforce_ver_order: true,
        /**
         * @type {current_session}
         */
        current_session: {
          failed_attempts: 0,
          init_time: null,
          completion_time: null,
        },
      },
      verInfo: {
        status: [
          {
            factor: "email",
            isVerified: false,
            timeInitiatized: new Date(),
          },
          /*  {
                          factor: "mobile",
                          isVerified: false,
                          timeInitiatized: new Date(),
                      }, */
        ],
        verSessID: nanoid(),
      },
      createdOn: new Date(),
      updatedOn: new Date(),
    };

    let res = await accountsCol.insertOne({ ...accToSave });
    if (prof_pic) {
      let data = await processImg({ data: prof_pic, folderName: email });
      let result = await accountsCol.updateOne(
        {
          email,
        },
        {
          $set: { prof_pic: data },
        }
      );
      if (result.result.ok) {
        console.log("Prof pic uploaded");
      }
    }
    /**
     * @type {accTemplate}
     */
    if (!res.insertedId) {
      console.log("Insert failed...");
      return null;
    }

    return {
      info: "Account created",
      verSessID: accToSave.verInfo.verSessID,
      accountID,
      factors_unverified: accToSave.verInfo.status
        .filter((obj) => !obj.isVerified)
        .map((obj) => obj.factor),
    };
  } catch (error) {
    console.log(error);
  }
}

async function createEmployeeAccountFunc(dataToSave) {
  try {
    let {
      email,
      username,
      phonenum,
      prof_pic,
      phonePin,
      acc_type = "employee",
    } = dataToSave;
    let accountID = nanoid();
    let docExists = await accountsCol.findOne({
      $or: [{ email }, { username }, { phonenum }],
    });
    console.log(docExists);
    if (docExists) {
      if (docExists.email === email) {
        return { err: { msg: "Email already exists..." } };
      }
      if (docExists.username === username) {
        return { err: { msg: "Username already exists..." } };
      }
      if (docExists.phonenum === phonenum) {
        return { err: { msg: "Phone number already exists..." } };
      }
    }
    /**
     * @type {accTemplate}
     */
    let accToSave = {
      email,
      accountID,
      phonenum,
      username,
      phonePin,
      loginInfo: {
        first_login: null,
        last_login: null,
        num_of_failed_logins: 0,
        factors: ["phone_pin"],
        enforce_all: true,
        enforce_ver_order: true,
        /**
         * @type {current_session}
         */
        current_session: {
          failed_attempts: 0,
          init_time: null,
          completion_time: null,
        },
      },
      verInfo: {
        status: [
          {
            factor: "phone_pin",
            isVerified: false,
            timeInitiatized: new Date(),
          },
        ],
        verSessID: nanoid(),
      },
      acc_type,
      activity: {
        history: [],
        current: {
          name: "inactive",
          from: new Date(),
          to: null,
        },
      },
      updatedOn: new Date(),
      createdOn: new Date(),
    };

    let res = await accountsCol.insertOne({ ...accToSave });
    if (prof_pic) {
      let data = await processImg({ data: prof_pic, folderName: email });
      let result = await accountsCol.updateOne(
        {
          email,
        },
        {
          $set: { prof_pic: data },
        }
      );
      if (result.result.ok) {
        console.log("Prof pic uploaded");
      }
    }
    /**
     * @type {accTemplate}
     */
    if (!res.insertedId) {
      console.log("Insert failed...");
      return null;
    }

    return {
      info: "Account created",
      verSessID: accToSave.verInfo.verSessID,
      accountID,
    };
  } catch (error) {
    console.log(error);
  }
}

/**
 *
 * @param {object} bioToSave
 * @param {string} bioToSave.email
 * @param {string} bioToSave.l_name
 * @param {string} bioToSave.f_name
 * @returns
 */
async function createBiodataFunc(bioToSave) {
  try {
    let { accountID, email, l_name, f_name, ...rest } = bioToSave;
    let res = await usersCol.insertOne({
      email,
      accountID,
      l_name,
      f_name,
      createdOn: new Date(),
      updatedOn: new Date(),
      meta: { ...rest },
    });
    if (!res.insertedId) {
      console.log("Insert  into users failed...");
      return null;
    }
    return { res, accountID };
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  registerFunc,
  createAccountFunc,
  createBiodataFunc,
  registerEmployeeFunc,
};
