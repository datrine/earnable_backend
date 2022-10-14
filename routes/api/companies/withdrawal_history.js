const router = require("express").Router();

//user id, email or username

router.post("/", async (req, res, next) => {
    try {

    } catch (error) {
        console.log(error)
    }
});

router.get("/", async (req, res, next) => {
    try {
        let { withdrawal_history } = req.session;
        res.json({ withdrawal_history });
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;