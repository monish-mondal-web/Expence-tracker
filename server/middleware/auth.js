const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getOrCreateDefaultUser } = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'finfood_super_secret_jwt_key_2026';

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
          return next();
        }
      } catch (jwtErr) {
        console.warn('[Auth] Invalid or expired JWT token:', jwtErr.message);
      }
    }

    // Guest fallback if no token or invalid token
    req.user = await getOrCreateDefaultUser();
    next();
  } catch (error) {
    next(error);
  }
};

const requireAuth = async (req, res, next) => {
  try {
    let token = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
    });
  }
};

module.exports = {
  authenticate,
  requireAuth,
};
