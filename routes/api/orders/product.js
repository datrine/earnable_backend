const router = require("express").Router()
const { validateOrders } = require("../../../utils/mymiddleware/orders/validateOrdersMW");

router.post("/create",validateOrders, async (req, res, next) => {
    try {
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;