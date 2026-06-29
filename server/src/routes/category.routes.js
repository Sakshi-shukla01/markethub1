const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.get('/', ctrl.getCategories);
router.post('/', protect, adminOnly, ctrl.createCategory);
router.delete('/:id', protect, adminOnly, ctrl.deleteCategory);

module.exports = router;
