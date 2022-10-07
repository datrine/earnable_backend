const router = require("express").Router();
const { getEmployeeFlexibleAccess } = require("../../../db/employee");
const changePhonepinEmployeeRouter = require("./changePhone");
const editEmployeeRouter = require("./editEmployee");

router.get("/flexible_access", async(req,res,next)=>{
    try {
        let {employeeID}=req.session.queried
       let getEmployeeFlexibleAccessRes=await getEmployeeFlexibleAccess({filters:{employeeID}});
       console.log(getEmployeeFlexibleAccessRes)
       res.json(getEmployeeFlexibleAccessRes)
    } catch (error) {
        res.json({err:error})
    }
});

router.use("/edit", editEmployeeRouter);

router.use("/change/phone_pin", changePhonepinEmployeeRouter);

module.exports = router;