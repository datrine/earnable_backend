const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const { ObjectId, UUID } = require("bson");

let addEmployee = async ({ ...employeeToData }) => {
    try {
        let result1 = await employeesCol.insertOne({
            _id: employeeToData.employeeID ? employeeToData.employeeID : ObjectId(), //UUID.generate().toString(),
            ...employeeToData,
            lastModified: new Date(),
            createdOn: new Date(),
        });
        if (!result1.insertedId) {
            return { err: { msg: "Unable to Add employee..." } }
        }
        return { employeeID: result1.insertedId.toString(), }
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};

let getEmployeesByCompanyID = async ({ companyID, filters }) => {
    try {
        let employeesCursor;
        let filterBuilder = {}

        if (filters.enrolled) {
            filterBuilder.enrolled = true
        }

        if (filters.unenrolled) {
            filterBuilder.enrolled = { $ne: true }
        }
        employeesCursor = await employeesCol.find({ $or: [{ companyID }, { companyID: ObjectId(companyID) }], ...filterBuilder });
        let employees = await employeesCursor.toArray();
        employees = employees.map(employee => ({ ...employee, employeeID: employee._id }))
        return { employees }
    } catch (error) {
        console.log({ err: error })
    }
}
let getTotalSalaries = async ({ companyID }) => {
    try {
        let docs = employeesCol.aggregate([
            {
              '$match': {
                'companyID': new ObjectId(companyID)
              }
            }, {
              '$group': {
                '_id': null, 
                'total_monthly_salaries': {
                  '$sum': {
                    '$toInt': '$monthly_salary'
                  }
                }
              }
            }
          ]
        )
        let results=await docs.toArray()
        let total_monthly_salaries= results[0].total_monthly_salaries
        return { total_monthly_salaries }
    } catch (error) {
        console.log(error)
    }
}

let getEmployeesByDepartmentID = async ({ companyID, departmentID, filters }) => {
    try {
        let employeesCursor;
        let filterBuilder = {}

        if (filters.enrolled) {
            filterBuilder.enrolled = true
        }

        if (filters.unenrolled) {
            filterBuilder.enrolled = { $ne: true }
        }

        employeesCursor = await employeesCol.find({ $or: [{ companyID }, { companyID: ObjectId(companyID) }], departmentID, filterBuilder });
        let employees = await employeesCursor.toArray();
        employees = employees.map(employee => ({ ...employee, employeeID: employee._id }))
        return { employees }
    } catch (error) {
        console.log({ err: error })
    }
}

let getEmployeeByEmployeeID = async ({ employeeID }) => {
    try {
        let employeeDoc = await employeesCol.find({ _id: ObjectId(employeeID) });
        if (!employeeDoc) {
            return { err: { msg: "Company not found" } }
        }

        return { company: { ...employeeDoc, employeeID } }
    } catch (error) {
        console.log({ err: error })
    }
}

module.exports = { addEmployee, getEmployeesByCompanyID, getEmployeeByEmployeeID, getEmployeesByDepartmentID, getTotalSalaries };