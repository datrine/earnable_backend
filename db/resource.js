const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const resourcesCol = waleprjDB.collection("resources");
/**
 * 
 * @param {object} param0
 * @param {string} param0.accountID
 * @param {string} param0.resourceDocID ID of the resource obj/doc
 * @param {"company"|"payroll"} param0.resource_type 
 * @returns 
 */
let createResource = async ({ accountID, resourceDocID, resource_type, }) => {
    try {
        let resourceResult = await resourcesCol.insertOne({
            accountID,
            resourceDocID,
            resource_type,
            lastModified: new Date(),
            createdOn: new Date(),
        });
        if (!resourceResult.insertedId) {
            return { err: { msg: "Unable to create resource" } }
        }
        return { resourceID: resourceResult.insertedId.toString(), }
    } catch (error) {
        res.status(500)
        console.log(error)
        res.json({ err: error })
    }
};

let getResourcesByAccID = async ({ accountID, filterIn = [] }) => {
    try {
        let resourcesCursor;
        if (filterIn.length > 0) {
            console.log(accountID)
            resourcesCursor = await resourcesCol.find({ accountID, resource_type: { $in: filterIn } });
        } else {
            resourcesCursor = await resourcesCol.find({ accountID, });
        }
        let resources = await resourcesCursor.toArray();
        return { resources }

    } catch (error) {
        console.log(error)
    }
}

let getResourceByResourceID = async ({ resourceDocID, filterIn = [] }) => {
    try {
        let resourceDoc;
        if (filterIn.length > 0) {
            console.log(resourceDocID)
            resourceDoc = await resourcesCol.findOne({ resourceDocID });
        } else {
            resourceDoc = await resourcesCol.findOne({ resourceDocID, });
        }
        let resource = resourceDoc
        return { resource }

    } catch (error) {
        console.log(error)
    }
}

module.exports = { createResource, getResourcesByAccID ,getResourceByResourceID};