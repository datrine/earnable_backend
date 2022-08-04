const router = require("express").Router()
const tokenVerifyMW = require("../../../utils/mymiddleware/tokenVerifyMW");
const { getAccountMW } = require("../../../utils/mymiddleware/accounts");
const sessIDVerifyMW = require("../../../utils/mymiddleware/sessIDVerifyMW");
const { sendPhoneText } = require("../../../from/utils/phone_mgt");
const { changePhonePin } = require("../../../db/account");

router.post("/", sessIDVerifyMW, async (req, res, next) => {
    try {
        res.status(400);
        let data = req.body;
        data.sessID = req.session.sessID;
        let allResponses = await changePhonePin({ ...data });
        let { err, ...rest } = allResponses;
        if (err) {
            res.status = 400
            return res.json({ err });
        }

        if (data.phonenum) {
            sendPhoneText({ to: data.phonenum, text: `Password has been changed.` }).
                then(res => {
                    console.log(res)
                })
        }
        res.json({ ...rest });
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
});

module.exports = router;