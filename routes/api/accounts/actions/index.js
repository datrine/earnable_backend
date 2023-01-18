const router = require("express").Router();
const subscriptionsRouter = require("../subscriptions");
const { getAuthAccount } = require("../../../../from/utils/middlewares/getAuthAccount");
const { accountLogOut, activateEmployeeAccount, updateAccInfo } = require("../../../../db/account");
const { processImg } = require("../../../../from/utils/processMedia");

//user id, email or username
router.put("/activate_new", async (req, res, next) => {
    try {
        
    let reqBody= req.body;
    console.log(reqBody)
    let { err,...rest } = await activateEmployeeAccount({ ...reqBody });
    if (err) {
        return res.json({ err })
    }
    return res.json({...rest})
    } catch (error) {
        console.log(error)
        res.json({err:error})
    }
});

router.put("/upload_initial_data", async (req, res, next) => {
    try {
        
    let reqBody= req.body;
    let {accountID}=reqBody
    console.log(reqBody);
    let prof_pic=req.files.prof_pic
   let imgData=await processImg({data:prof_pic});
   let response= updateAccInfo({accountID,prop:"prof_pic",propValue:imgData});
    //let { err,...rest } = await activateEmployeeAccount({ ...reqBody });
    res.json(response)
    if (err) {
        return res.json({ err })
    }
    return res.json({...rest})
    } catch (error) {
        console.log(error)
        res.json({err:error})
    }
});
//user id, email or username
router.use("/", getAuthAccount,);
router.use("/subscriptions", subscriptionsRouter);

router.get("/", (req, res, next) => {
    return res.json([])
});



router.use("/logout", getAuthAccount, async (req, res, next) => {
    try {
        let { sessID } = req.session
        let resLogOut = await accountLogOut({ sessID });
        console.log(resLogOut)
        res.json(resLogOut)
    } catch (error) {

    }
});

module.exports = router;