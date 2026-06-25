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
      const isTokenError = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError';
      if (!isTokenError) console.error('JWT Verification Error:', error.message);
      const message = error.name === 'TokenExpiredError'
        ? 'Token expired, please login again'
        : 'Invalid token, please login again';
      return res.status(401).json({ status: 'fail', message });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Not authorized, no token provided' });
  }
};

// Like protect, but never rejects — populates req.user when a valid Bearer token
// is present, otherwise continues with req.user undefined. Used by public routes
// that want to optionally personalize the response for a logged-in caller.
export const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer')) return next();

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && !user.isSuspended) req.user = user;
  } catch {
    // Invalid/expired token on a public route — ignore and continue unauthenticated
  }
  next();
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
