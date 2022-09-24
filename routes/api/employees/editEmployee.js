const router = require("express").Router();
const { mongoClient, ObjectID } = require("../../../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const employeesCol = waleprjDB.collection("employees");
const { ObjectId } = require("bson");
const { hasRole } = require("../../../db/role");
const {
  getAuthAccount,
} = require("../../../from/utils/middlewares/getAuthAccount");

router.put("/", getAuthAccount, async (req, res, next) => {
  try {
    let { account } = req.session;
    let hasRoleRes = await hasRole({ accountID: account.accountID, rolename });
    if (!hasRoleRes) {
      return res.json({ err: { msg: "You do not have authorization." } });
    }
    let updateData = req.body;
  } catch (error) {
    res.json({ err: error });
  }
});

module.exports = router;
