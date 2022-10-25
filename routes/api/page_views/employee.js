const router = require("express").Router();
const {
  getDashboardInfoForEmployee,
} = require("../../../db/calculations");

// page_views/employee/dashboard_index
router.get("/dashboard_index", async (req, res, next) => {
  try {
  let filters = req.query;
  let getAmountToRefundRes = await getDashboardInfoForEmployee({ filters });
  return res.json(getAmountToRefundRes);
  } catch (error) {
    console.log(error);
    res.json({err:error})
  }
});

//
module.exports = router;
