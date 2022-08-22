let current_session = {
    failed_attempts: 0,
    /**
     * @type {Date}
     */
    init_time: null,
    /**
     * @type {Date}
     */
    completion_time: null,
    /**
     * @type {number}
     */
    sessID: undefined,
    /**
     * @type {string}
     */
    next_factor_token: undefined,
    /**
     * @type {string}
     */
    next_factor_act_time: undefined,
    /**
     * @type {Date}
     */
    expires_on: null,
    /**
     * @type {boolean}
     */
    is_ver_complete: undefined,
    /**
     * @type {[{factor:"direct"|"mobile"|"email"|"phone_pin",time:Date}]}
     */
    factors_verified: null,
    /**
     * @type {Date}
     */
    createdOn: null,
    /**
     * @type {Date}
     */
    updatedOn: null
}

let loginInfo = {
    /**
     * @type {Date}
     */
    first_login: null,
    /**
     * @type {Date}
     */
    last_login: null,
    /**
     * @type {Date}
     */
    logout_time: null,
    /**
     * @type {number}
     */
    num_of_failed_logins: 0,
    /**
     * @type {["direct"|"mobile"|"email"|"phone_pin"]}
     */
    factors: undefined,
    /**
     * @type {boolean}
     */
    enforce_all: undefined,
    /**
     * @type {boolean}
     */
    enforce_ver_order: undefined,
    /**
     * @type {number}
     */
    duration_of_auth: undefined,
    /**
     * @type {current_session}
     */
    current_session
}

let verInfo = {
    /**
     * @type [{factor:"direct"|"mobile"|"email"|"phone_pin",tokenSent:false, isVerified:false,timeInitiatized:Date,timeVerified:Date}]
     */
    status: [],
    /**
     * @type {boolean}
     */
    isMobileVer: false,
    /**
     * @type {string}
     */
    verSessID: null,
}

let current_activity = {
    /**
     * @type {"inactive"|"active"|"blocked"|"suspended"}
     */
    name: "",
    from: new Date(),
    to: null
}

let accTemplate = {
    /**
     * @type {string}
     */
    email: undefined,
    /**
     * @type {string}
     */
    phonePin: undefined,
    /**
     * @type {string}
     */
    accountID: undefined,
    /**
     * @type {string}
     */
    phonenum: undefined,
    /**
     * @type {string}
     */
    username: undefined,
    /**
     * @type {string}
     */
    passHash: undefined,
    loginInfo,
    verInfo,
    /**
     * @type {"employer"|"employee"}
     */
    acc_type:"",
    activity: {
        /**
         * @type {current_activity}
         */
        current:null,
        /**
         * @type {[current_activity]}
         */
        history: [],
    },
    createdOn: new Date(), updatedOn: new Date()
}
module.exports = accTemplate;