const router = require("express").Router();
const { checkIfEmployeePropExists } = require("../../../db/employee");
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

router.get("/checkifexists/:prop/:value", async (req, res, next) => {
    let { prop, value } = req.params;
    let { exists } = await checkIfEmployeePropExists({ prop, value });
    console.log({ exists })
    return res.json({ exists })
});

module.exports = router;