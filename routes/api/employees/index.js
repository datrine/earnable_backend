const router = require("express").Router();
const addEmployeeRouter = require("./addEmployee");
const changePhonepinEmployeeRouter = require("./changePhone");
const editEmployeeRouter = require("./editEmployee");
const loginProductRouter = require("./login");

router.use("/add", addEmployeeRouter);

router.use("/:employeeID/", async(req,res,next)=>{
    try {
        let {employeeID}=req.params;
        req.session.employeeID=employeeID;
        next()
    } catch (error) {
        console.log(error);
        
    }
});

router.use("/:employeeID/edit", editEmployeeRouter);

router.use("/login", loginProductRouter);

router.use("/change/phone_pin", changePhonepinEmployeeRouter);

router.get("/", async(req,res,next)=>{
    try {
        
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;