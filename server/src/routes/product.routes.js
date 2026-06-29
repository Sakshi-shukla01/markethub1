const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Specific routes first
router.get('/search', ctrl.searchProducts);
router.get('/me/listings', protect, ctrl.myListings);
router.get('/me/recently-viewed', protect, ctrl.recentlyViewed);

router.get('/', ctrl.getProducts);
router.get('/:id', optionalAuth, ctrl.getProductById);

router.post('/', protect, upload.array('images', 6), ctrl.createProduct);
router.put('/:id', protect, upload.array('images', 6), ctrl.updateProduct);
router.delete('/:id', protect, ctrl.deleteProduct);

module.exports = router;
