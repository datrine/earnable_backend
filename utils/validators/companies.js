const inspector = require('schema-inspector');

function cleanAndValidateNewCompany(company) {
    company = Object.assign({}, company)
    let resultOfValidation = inspector.validate({
        type: "object",
        properties: {
            company_name: { type: "string", optional: false },
            desc: { type: "string", optional: true, },
            rc_number: { type: "string", optional: false, },
            is_rc_verified: { type: "boolean", optional: true, },
            payment_email: { type: "string", optional: true, },
            tax_id: { type: "string", optional: true, },
            creatorMeta: {
                type: 'object',
                optional: false,
                properties: {
                    _id: { type: "any", optional: false },
                    email: { type: "string", optional: false,pattern:"email" },
                }
            }
        }
    }, company);
    if (!resultOfValidation.valid) {
        throw resultOfValidation.error
    }
    return company;
}

function cleanCompanyDataUpdate(user) {
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
        user.addressInfo = JSON.parse(JSON.stringify(user.addressInfo));
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

module.exports = { cleanAndValidateNewCompany,cleanCompanyDataUpdate }