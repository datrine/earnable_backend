const router = require("express").Router()
const { getEmployeesByCompanyID } = require("../../../../../../db/employee");

router.get("/", async (req, res, next) => {
    try {
        let {department } = req.session;
        let {dept_policies}=department;
        if (!dept_policies) {
            return res.json({policy_logs:[]})
        }
        if (1>0) {
            return res.json({policy_logs:dept_policies});
        }
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;