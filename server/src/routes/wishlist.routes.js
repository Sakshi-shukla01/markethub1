const router = require('express').Router();
const ctrl = require('../controllers/wishlist.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, ctrl.getWishlist);
router.post('/:productId', protect, ctrl.toggleWishlist);

module.exports = router;
