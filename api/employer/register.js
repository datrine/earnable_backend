const { registerFunc } = require("../../db/register");

const axios = require("axios").default;
const AUTH_SERVER = process.env.NODE_ENV === "production" ? process.env.AUTH_SERVER : "http://localhost:5000";
const router = require("express").Router();

router.post("/local", async (req, res, next) => {
    try {
        let prof_pic = req.files && req.files.prof_pic
        let allResponses = await
            registerFunc({ ...req.body, prof_pic });
        console.log(allResponses)
        let { err, ...rest } = allResponses;
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        res.json({ ...rest })
        req.session.email=req.body.email

        /*let responseFromServer = await axios.post(`${AUTH_SERVER}/api/register/local`, { ...req.body });
        let data = responseFromServer.data
        return res.json(data)*/
    } catch (error) {
        console.log(error);
        next("Server error")
    }
}, async (req, res, next) => {
    try {
        console.log({ info: "Email sent..." })
    } catch (error) {
        console.log(error);
        next("Server error")
    }
})
module.exports = router;