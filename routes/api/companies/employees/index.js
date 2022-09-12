const router = require("express").Router()
const { getBiodataFunc, retrieveAccountInfoBasic } = require("../../../../db/account");
const { getEmployeesByCompanyID } = require("../../../../db/employee");

router.use("/", async (req, res, next) => {
    try {
        let { companyID } = req.session
        let filters = req.query
        //console.log(req.query)
        let rolesRes = await getEmployeesByCompanyID({ companyID,filters });
        if (rolesRes.err) {
            return res.json(rolesRes)
        }
        req.session.employees = rolesRes.employees;
        next()
    } catch (error) {
        console.log(error)
    }
});

router.get("/count", async (req, res, next) => {
    try {
        let { employees } = req.session
        return res.json({ employeeCount:employees.length })
    } catch (error) {
        console.log(error)
    }
});

router.get("/list", async (req, res, next) => {
    try {
        let { employees } = req.session
        return res.json({ employees })
    } catch (error) {
        console.log(error)
    }
});

router.get("/info", async (req, res, next) => {
    try {
        let { employees } = req.session;
        let employeesInfo=[]
        for (const employee of employees) {
            let {account,}=await retrieveAccountInfoBasic({identifier:employee. accountID})
            if (!account) {
                continue
            }
            let {accountID,email}=account
            let {user}=await getBiodataFunc({accountID,email});
            if (!user) {
                continue
            }
            let employeeInfo={...employee,...account,...user};
            employeesInfo.push(employeeInfo)
        }
        return res.json({ employeesInfo })
    } catch (error) {
        console.log(error)
    }
});

router.get("/", async (req, res, next) => {
    try {
        let { employees } = req.session
        return res.json({ employees })
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;