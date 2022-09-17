const router = require("express").Router();
const logsRouter = require("./logs");

router.use("/logs", logsRouter);

router.get("/", async (req, res, next) => {
    try {
        let { employees } = req.session
        return res.json({employees})
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;