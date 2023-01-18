const inspector = require('schema-inspector');

function cleanAndValidateNewProduct(company) {
    let tempCompany = Object.assign({}, company);
    let { companyID, price, firstname,lastname,phonenum, desc, brand, priceInfo, instock, ...otherMeta } = tempCompany
    tempCompany.meta = otherMeta || {};
    delete tempCompany.price;

    let resultOfValidation = inspector.validate({
        type: "object",
        properties: {
            firstname: { type: "string", optional: true, minLength: 2, },
            lastname: { type: "string", optional: true, minLength: 2, },
            companyID: { type: "string", optional: false, },
            email: { type: "string", optional: true, },
            phonenum: { type: "string", optional: false, },
            phonepin:{type:"string",optional:true}
        }
    }, tempCompany);
    if (!resultOfValidation.valid) {
        throw resultOfValidation.error
    }

    return tempCompany;
}

function cleanProductDataUpdate(company) {
    let tempCompany = Object.assign({}, company);
    let { companyID, price, firstname,lastname,phonenum, desc, brand, priceInfo, instock, ...otherMeta} = tempCompany
   
    //delete tempCompany;

    let resultOfSanitation = inspector.sanitize({
        type: "object",
        properties: {
            firstname: { type: "string" },
            lastname: { type: "string", optional: true },
            phonenum: { type: "any", optional: true },
            phonepin:{type: "string", optional: true }
        }
    }, company);
    return resultOfSanitation;
}
module.exports = { cleanAndValidateNewProduct, cleanProductDataUpdate }