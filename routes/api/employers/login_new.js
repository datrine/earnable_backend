const axios = require("axios").default;
//const generateToken = require("../../utils/middlewares/generateTokenMW");
//const sendEmailToken = require("../../utils/middlewares/sendEmailToken");
const AUTH_SERVER = process.env.NODE_ENV === "production" ?
    process.env.AUTH_SERVER : "http://localhost:5000";
const router = require("express").Router();

router.post("/direct", async (req, res, next) => {
    try {
        let responseFromServer = await axios.post(`${AUTH_SERVER}/api/login/direct`, { ...req.body });
        let data = responseFromServer.data
        let { err, account, state } = data
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        console.log(state)
        req.session.state = state
        if (!account) {
            return res.json({ state });
        }
        req.session.account = account;
        return res.json({ state, account });
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.post("/token/email", async (req, res, next) => {
    try {
        let responseFromServer = await axios.post(`${AUTH_SERVER}/api/login/token/email`, { ...req.body });
        let data = responseFromServer.data
        let { err, account, state } = data
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        req.session.state = state
        if (!account) {
            return res.json({ state, });
        }
        req.session.account = account;
        return res.json({ state, account });
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.post("/token/mobile", async (req, res, next) => {
    try {
        let { err, account, user, state } = await mobileSMSLoginFunc(req.body);
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        req.session.state = state
        if (!account) {
            return res.json({ state, });
        }
        req.session.account = account;
        return res.json({ state, account });
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.post("/next_token?", async (req, res, next) => {
    try {
        let responseFromServer = await axios.post(`${AUTH_SERVER}/api/login/next_token?action=activate_token`, { ...req.body });
        let data = responseFromServer.data
        console.log(data)
        return res.json(data);
        // next()
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

module.exports = router;