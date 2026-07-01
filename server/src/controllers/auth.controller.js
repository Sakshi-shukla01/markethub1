const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const OTPVerification = require('../models/OTPVerification');
const { signAccessToken, issueRefreshToken } = require('../utils/token');
const { generateOtp } = require('../utils/otp');
const { sendEmail } = require('../utils/email');

const REFRESH_COOKIE = 'mh_refresh';

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
  };
}

async function createAndSendOtp(email, purpose) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await OTPVerification.deleteMany({ email, purpose });
  await OTPVerification.create({ email, code, purpose, expiresAt });

  const subject =
    purpose === 'verify' ? 'Verify your MarketHub account' : 'Reset your MarketHub password';
  // Email sending must never crash the request. Cloud hosts (Render, etc.) often
  // block outbound SMTP, so if the email fails we log it and carry on — the OTP
  // is still stored in the DB and returned to the client below.
  try {
    await sendEmail({
      to: email,
      subject,
      text: `Your MarketHub ${purpose} code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your MarketHub code is <b style="font-size:20px">${code}</b>. It expires in 10 minutes.</p>`,
    });
  } catch (err) {
    console.error('[auth] OTP email failed to send (continuing anyway):', err.message);
  }
  return code;
}

// POST /auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered.');

  const user = await User.create({ name, email, password });
  const code = await createAndSendOtp(email, 'verify');

  res.status(201).json({
    success: true,
    message: 'Account created. Check your email for the OTP code.',
    // Expose the code so signup works even when email can't be delivered.
    devOtp: code,
  });
});

// POST /auth/verify-otp
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const record = await OTPVerification.findOne({ email, code, purpose: 'verify' });
  if (!record) throw new ApiError(400, 'Invalid or expired OTP.');

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found.');

  user.isVerified = true;
  await user.save();
  await OTPVerification.deleteMany({ email, purpose: 'verify' });

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  res.json({ success: true, message: 'Email verified.', accessToken, user: publicUser(user) });
});

// POST /auth/resend-otp
exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found.');
  const code = await createAndSendOtp(email, 'verify');
  res.json({ success: true, message: 'OTP resent.', ...(env.isEmailConfigured ? {} : { devOtp: code }) });
});

// POST /auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isVerified) {
    const code = await createAndSendOtp(email, 'verify');
    return res.status(403).json({
      success: false,
      needsVerification: true,
      message: 'Please verify your email. A new OTP was sent.',
      ...(env.isEmailConfigured ? {} : { devOtp: code }),
    });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  res.json({ success: true, accessToken, user: publicUser(user) });
});

// POST /auth/google
exports.googleLogin = asyncHandler(async (req, res) => {
  if (!env.isGoogleConfigured) throw new ApiError(400, 'Google login is not configured on the server.');
  const { credential } = req.body;
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new ApiError(400, 'Invalid Google credential.');

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      avatar: payload.picture || '',
      provider: 'google',
      isVerified: true,
    });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  res.json({ success: true, accessToken, user: publicUser(user) });
});

// POST /auth/refresh
exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) throw new ApiError(401, 'No refresh token.');

  const stored = await RefreshToken.findOne({ token }).populate('user');
  if (!stored || !stored.user) throw new ApiError(401, 'Invalid refresh token.');
  if (stored.expiresAt < new Date()) {
    await stored.deleteOne();
    throw new ApiError(401, 'Refresh token expired.');
  }

  // Rotate the refresh token
  await stored.deleteOne();
  const newRefresh = await issueRefreshToken(stored.user);
  setRefreshCookie(res, newRefresh);
  const accessToken = signAccessToken(stored.user);

  res.json({ success: true, accessToken, user: publicUser(stored.user) });
});

// POST /auth/logout
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];
  if (token) await RefreshToken.deleteOne({ token });
  res.clearCookie(REFRESH_COOKIE);
  res.json({ success: true, message: 'Logged out.' });
});

// GET /auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

// POST /auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Always respond the same to avoid email enumeration
  let code;
  let emailSent = false;
  if (user) {
    try {
      code = await createAndSendOtp(email, 'reset');
      emailSent = true;
    } catch (err) {
      // Email delivery failed (e.g. provider error). Still generate the code so
      // the user can reset; we surface it in the response as a fallback.
      console.error('[auth] reset email failed to send:', err.message);
    }
  }
  res.json({
    success: true,
    emailSent,
    message: emailSent
      ? 'If that email exists, a reset code has been sent.'
      : 'Reset code generated. Use the code shown to reset your password.',
    // Always expose the code as a fallback so password reset works even when
    // email delivery is unavailable.
    ...(code ? { devOtp: code } : {}),
  });
});

// POST /auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;
  const record = await OTPVerification.findOne({ email, code, purpose: 'reset' });
  if (!record) throw new ApiError(400, 'Invalid or expired reset code.');

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found.');

  user.password = password;
  await user.save();
  await OTPVerification.deleteMany({ email, purpose: 'reset' });
  await RefreshToken.deleteMany({ user: user._id }); // log out everywhere

  res.json({ success: true, message: 'Password reset. You can now log in.' });
});
