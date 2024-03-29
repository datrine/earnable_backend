const inspector = require('schema-inspector');

function cleanAndValidateUser(user) {
    user = Object.assign({}, user)
    let resultOfValidation = inspector.validate({
        type: "object",
        properties: {
            f_name: { type: "string", optional: true },
            email: { type: "string", optional: false, pattern: "email" },
            l_name: { type: "string", optional: true },
            password: { type: 'any', optional: false },
            username: { type: 'any', optional: false },
            prof_pic: { type: "any", optional: true },
        }
    }, user)
    if (!resultOfValidation.valid) {
        throw resultOfValidation.error
    }
    return user;
}

function cleanUserDataUpdate(user) {
    user = Object.assign({}, user);
    if (user.address || user.cityOrTown || user.country) {
        user.addressInfo = {
            ...user.addressInfo,
            address: user.address,
            cityOrTown: user.cityOrTown,
            country: user.country
        }
        delete user.address
        delete user.cityOrTown
        delete user.country
        user.addressInfo =JSON.parse(JSON.stringify(user.addressInfo));
    }

    let resultOfValidation = inspector.validate({
        type: "object",
        strict: true,
        properties: {
            f_name: { type: "string", optional: true },
            l_name: { type: "string", optional: true },
            gender: { type: 'string', optional: true },
            addressInfo: {
                type: 'object',
                optional: true,
                properties: {
                    cityOrTown: { type: "string", optional: true },
                    country: { type: "string", optional: true },
                    address: { type: "string", optional: true },
                }
            },
            prof_pic: { type: "any", optional: true },
        }
    }, user);
    if (!resultOfValidation.valid) {
        throw resultOfValidation.error
    }
    let resultOfSanitation = inspector.sanitize({
        type: "object",
        properties: {
            f_name: { type: "string" },
            l_name: { type: "string", optional: true },
            l_name: { type: "string", optional: true },
            prof_pic: { type: "any", optional: true },
        }
    }, user);
    return resultOfSanitation;
}
module.exports = { cleanAndValidateUser, cleanUserDataUpdate }