import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - Verify JWT
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ status: 'fail', message: 'User no longer exists' });
      }

      if (req.user.isSuspended) {
        return res.status(403).json({ status: 'fail', message: 'Your account has been suspended. Please contact support.' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ status: 'fail', message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Not authorized, no token provided' });
  }
};

// Check for specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `User role '${req.user?.role || 'guest'}' is not authorized to access this route`
      });
    }
    next();
  };
};
