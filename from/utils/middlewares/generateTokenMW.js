const { getRandomToken } = require("../token_mgt");

let generateEmailToken= async (req, res, next) => {
    try {
        let token = getRandomToken({ minLength: 6 });
        req.session.token = token;
        next()
    } catch (error) {
        console.log(error);
    }
}

let generateMobileToken= async (req, res, next) => {
    try {
        let token = getRandomToken({ minLength: 4 });
        req.session.token = token;
        next()
    } catch (error) {
        console.log(error);
    }
}

let generatePhonePinToken= async (req, res, next) => {
    try {
        let token = getRandomToken({ minLength: 4 });
        req.session.token = token;
        next()
    } catch (error) {
        console.log(error);
    }
}

module.exports={generateToken: generateEmailToken,generateMobileToken,generatePhonePinToken};