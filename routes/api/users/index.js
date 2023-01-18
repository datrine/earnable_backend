const router = require("express").Router();
//user id, email or username
router.get("/:id", (req, res, next) => {
    console.log(req.headers["authorization"])
    let { id } = req.params;
    return res.json({ id })
});

router.get("/", (req, res, next) => {
    return res.json([])
});

module.exports = router;