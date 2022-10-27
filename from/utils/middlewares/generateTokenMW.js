const { getRandomToken } = require("../token_mgt");

let generateEmailToken = async (req, res, next) => {
  try {
    let token = getRandomToken({ minLength: 6 });
    req.session.token = token;
    req.session.queried.token = token;
    next();
  } catch (error) {
    console.log(error);
  }
};

let generateMobileToken = async (req, res, next) => {
  try {
    let token = getRandomToken({ minLength: 4 });
    req.session.token = token;
    req.session.queried.token = token;
    next();
  } catch (error) {
    console.log(error);
  }
};

let generateOTPToken = async (req, res, next) => {
  try {
    let otp = getRandomToken({ minLength: 4 });
    req.session.otp = otp;
    req.session.queried.otp = otp;
    next();
  } catch (error) {
    console.log(error);
  }
};
let generatePhonePinToken = async (req, res, next) => {
  try {
    let token = getRandomToken({ minLength: 4 });
    req.session.token = token;
    req.session.queried.token = token;
    next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  generateToken: generateEmailToken,
  generateMobileToken,
  generatePhonePinToken,
  generateOTPToken,
};
