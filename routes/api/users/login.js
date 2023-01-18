const router = require("express").Router();
const { directLoginFunc, emailLoginFunc, mobileSMSLoginFunc } = require("../../../db/login");
const { getUnAuthenticatedFactors, activateNext, retrieveAccountInfoBySessID } = require("../../../db/account");


router.post("/direct", async (req, res, next) => {
    try {
        let { err, account, state } = await directLoginFunc(req.body);
        if (err) {
            res.status = 400
            return res.json({ err });
        }
        req.session.state = state
        if (!account) {
            return res.json({ state });
        }
        req.session.self={...req.session.self}
        req.session.self.state = state
        req.session.account = account;
        req.session.self.account = account;
        return res.json({ state, account });
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.use("/token", async (req, res, next) => {
    try {
        console.log("The tokens...");
        req.body.token = Number(req.body.token)
        next()
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

router.post("/token/email", async (req, res, next) => {
    try {
        let { err, account, user, state } = await emailLoginFunc(req.body);
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
        let { action, factor } = req.query;
        let { sessID } = req.body;
        if (!sessID) {
            return res.json({ err: { msg: "SessID cannot be empty.." } });
        }
        console.log("sessID:......" + sessID)
        let { err, account } = await retrieveAccountInfoBySessID(sessID);
        if (err) {
            return res.json({ err });
        }
        let sessExpiresOn = account.loginInfo.current_session.expires_on
        if (!!sessExpiresOn && (sessExpiresOn <= new Date())) {
            return res.json({
                err: { msg: "Session has expired...", type: "sess_exp" },
                state: "sess_expired"
            })
        }
        let unauthenticated_factors = getUnAuthenticatedFactors(account);
        let next_factor = factor && unauthenticated_factors.find(fac => fac === factor);
        if (factor && !next_factor) {
            console.log(`${factor} factor fully activated and verified`)
            return res.json({
                err: {
                    msg: `${factor} factor fully activated and verified`,
                    type: "fac_ver"
                }
            })
        }
        next_factor = unauthenticated_factors[0];
        if (!next_factor) {
            console.log("All factors fully activated and verified")
            return res.json({ err: { msg: "All factors verified", type: "full_ver" } })
        }
        console.log(next_factor)
        
        switch (action) {
            case "get_factor": {
                res.json({ next_factor })
                break;
            }
            case "activate_token": {
                let my_res = await activateNext({ factorToActivate: next_factor, account })
                console.log("factor's token sent...")
                console.log(my_res)
                res.json(my_res)
                break;
            }
            default:
                break;
        }
        console.log("The tokens...");
        // next()
    } catch (error) {
        console.log(error);
        next("Server error")
    }
});

module.exports = router;