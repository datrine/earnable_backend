const composeEmail = require("../../../../utils/emailServices/composeEmail");
const { getUserFromDB } = require("../../../../utils/quickGets/user");

/**
 * 
 * @param {object} evt 
 * @param {object} evt.id
 * @param {string} evt.operationType
 * @param {object} evt.clusterTime
 * @param {string} evt.clusterTime._bsontype
 * @param {object} evt.fullDocument
 * @param {object} evt.fullDocument.creatorMeta
 * @param {object} evt.fullDocument.creatorMeta._id
 * @param {object} evt.fullDocument.creatorMeta.email
 * @param {object} evt.ns
 * @param {object} evt.documentKey
 * @param {0xff} evt.documentKey._id
 */
async function newShopAdd({ fullDocument }) {
    try {
        if (fullDocument) {
            if (fullDocument.creatorMeta && fullDocument.creatorMeta.email) {
                let toEmail = fullDocument.creatorMeta.email
                let user =await getUserFromDB({ email: toEmail });
                if (user) {

                   await composeEmail({
                        to: toEmail,
                        subject:"New Shop Creation",
                        html: `<p>You just created a new shop</p>`
                    });
                    console.log("Email sent")
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = newShopAdd;