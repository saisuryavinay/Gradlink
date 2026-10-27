import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database is not connected. Please configure MONGODB_URI.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Account not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email address before continuing.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    // Always use the role stored in the database — never trust the client
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
};
