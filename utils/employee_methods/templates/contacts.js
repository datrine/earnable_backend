let contactsTemplate = {
    /**
     * @type {string}
     */
    email: undefined,
    /**
     * @type {string}
     */
    accountID: undefined,
    /**
     * @type {[{accountID:string,email:string,preferred_name:string,addedOn:Date}]}
     */
    data: undefined,
    createdOn: new Date(), updatedOn: new Date()
}

module.exports = contactsTemplate;