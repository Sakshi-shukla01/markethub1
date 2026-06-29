const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');

router.post('/create', protect, ctrl.createCheckout);
router.post('/confirm', protect, ctrl.confirmCheckout);
router.get('/my-orders', protect, ctrl.myOrders);

module.exports = router;