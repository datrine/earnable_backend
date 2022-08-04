let keyTemplate = {
    /**
     * @type {string}
     */
    accountID: undefined,
    /**
     * @type {string}
     */
    password: undefined,
    /**
     * @type {string}
     */
    iv: undefined,
    /**
     * @type {string}
     */
    salt: undefined,
    /**
     * @type {Buffer}
     */
    wrappedKey: undefined,
    createdOn: new Date(), updatedOn: new Date()
}

module.exports = keyTemplate;