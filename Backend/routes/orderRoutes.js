const express = require('express');
const router = express.Router();
const { getLatestPendingOrder, confirmOrder } = require('../controllers/orderController');

router.get('/orders/latest/:restaurantId', getLatestPendingOrder);
router.put('/orders/:orderId/confirm', confirmOrder);

module.exports = router;
