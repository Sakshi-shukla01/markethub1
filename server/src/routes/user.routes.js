const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.put('/profile', protect, upload.single('avatar'), ctrl.updateProfile);

module.exports = router;
