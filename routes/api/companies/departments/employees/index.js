const router = require("express").Router()
const { getEmployeesByCompanyID, getEmployeesByDepartmentID } = require("../../../../../db/employee");

router.use("/", async (req, res, next) => {
    try {
        let { companyID,departmentID:deptID, } = req.session
        let filters = req.query
        let rolesRes = await getEmployeesByDepartmentID({ companyID,deptID,filters });
        if (rolesRes.err) {
            return res.json(rolesRes)
        }
        req.session.employees = rolesRes.employees;
        next()
    } catch (error) {
        console.log(error)
    }
});

router.get("/", async (req, res, next) => {
    try {
        let { employees } = req.session
        return res.json({employees})
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;