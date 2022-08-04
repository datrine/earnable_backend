const { getRandomToken } = require("../token_mgt");

let generateToken= async (req, res, next) => {
    try {
        let token = getRandomToken({ minLength: 6 });
        req.session.token = token;
        next()
    } catch (error) {
        console.log(error);
    }
}

module.exports=generateToken;