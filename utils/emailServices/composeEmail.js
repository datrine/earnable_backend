
const { default: axios } = require("axios");

async function composeEmail(opts = { from, to:"waleprj@megamega.com", text, html,subject }) {
    let data = opts
    return axios.post(process.env.EMAIL_SERVICES_URL, data)
}

module.exports=composeEmail