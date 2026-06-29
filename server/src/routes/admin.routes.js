const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.use(protect, adminOnly);

router.get('/analytics', ctrl.getAnalytics);
router.get('/users', ctrl.getUsers);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/products', ctrl.getProducts);
router.put('/products/:id/approve', ctrl.moderateProduct);
router.delete('/products/:id', ctrl.deleteProduct);
router.get('/orders', ctrl.getOrders);

module.exports = router;
