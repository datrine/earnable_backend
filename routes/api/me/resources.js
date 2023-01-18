const { getCompaniesByIDs } = require("../../../db/company");
const { getResourcesByAccID } = require("../../../db/resource");

const router = require("express").Router();

router.use("/", async (req, res, next) => {
    try {
        let account = req.session.account
        let {accountID} = account
        let filter = req.path.split("/")[1];
        let filterIn=[];
        switch (filter) {
            case "companies":
                filterIn.push("company");
                break;
            default:
                break;
        }
        console.log(filterIn)
        let resourcesRes = await getResourcesByAccID({ accountID,filterIn });
        console.log(resourcesRes);
        if (resourcesRes.err) {
            return res.json(resourcesRes)
        }
        req.session.resources = resourcesRes.resources
        next()
    } catch (error) {
        console.log(error);
    }
});

router.get("/companies", async (req, res, next) => {
    let resources = req.session.resources;
    let companiesRes = await getCompaniesByIDs({ ids: [...resources].map(resource => resource.resourceDocID) });
    return res.json(companiesRes)
});
module.exports = router