const router = require("express").Router();
const { getWithdrawalHistory } = require("../../../db/withdrawal");

//user id, email or username

router.post("/", async (req, res, next) => {
    try {

    } catch (error) {
        console.log(error)
    }
});

router.get("/", async (req, res, next) => {
    try {
        let { filters } = req.session.queried;
        let withdrawalHistoryRes = await getWithdrawalHistory({
          filters,
        });
        res.json(withdrawalHistoryRes);
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;