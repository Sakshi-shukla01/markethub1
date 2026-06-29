const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

// Requires a valid access token
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) throw new ApiError(401, 'Not authenticated. Please log in.');

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'User no longer exists.');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired.'));
    }
    next(new ApiError(401, err.message || 'Not authenticated.'));
  }
};

module.exports = { protect };

// Attaches req.user if a valid token is present, but never blocks the request
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch (_) {
    // ignore invalid token for optional routes
  }
  next();
};

module.exports.optionalAuth = optionalAuth;
