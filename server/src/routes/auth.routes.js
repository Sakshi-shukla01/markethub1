const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const v = require('../validators/auth.validator');

// Stricter limiter on login/register to slow brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again later.' },
});

router.post('/register', authLimiter, validate(v.registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(v.loginSchema), ctrl.login);
router.post('/google', validate(v.googleSchema), ctrl.googleLogin);
router.post('/verify-otp', validate(v.verifyOtpSchema), ctrl.verifyOtp);
router.post('/resend-otp', ctrl.resendOtp);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', protect, ctrl.me);
router.post('/forgot-password', authLimiter, validate(v.forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', validate(v.resetPasswordSchema), ctrl.resetPassword);

module.exports = router;
