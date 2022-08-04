const { retrieveAccountInfoByVerSessID } = require("../../db/account");
const router = require("express").Router();

router.use("/:verSessID", async (req, res, next) => {
    try {
        let { verSessID } = req.params
        console.log(verSessID)
        let allResponses = await
            retrieveAccountInfoByVerSessID(verSessID);
        console.log(allResponses)
        let { err, ...rest } = allResponses;
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        req.session.verInfo = rest.account.verInfo
        next()
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.get("/:verSessID/next_factor", async (req, res, next) => {
    try {
        let { verInfo } = req.session
        let next_factor = verInfo.status?.filter(obj => obj.isVerified)[0]?.factor
        res.json({ next_factor })
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.get("/:verSessID/email", async (req, res, next) => {
    try {
        let { verInfo } = req.session
        let emailStatus = verInfo.status.find(item => item.factor === "email")
        res.json({ status: emailStatus })
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.get("/:verSessID/", async (req, res, next) => {
    try {
        let { verInfo } = req.session
        let emailStatus = verInfo.status.find(item => item.factor === "email")
        res.json({ verInfo })
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});
router.get("/:verSessID/status/phonenum", async (req, res, next) => {
    try {
        let { verInfo } = req.session.account;

        res.json({ phonenum })

    } catch (error) {
        console.log(error);
        next("Server error")
    }
});


module.exports = router