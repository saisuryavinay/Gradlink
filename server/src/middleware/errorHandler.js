export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join('. ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field];
    if (field === 'email') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    return res.status(409).json({ message: `Duplicate value for ${field}: ${value}` });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format.' });
  }

  // JWT errors (shouldn't reach here if auth middleware handles them, but just in case)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token.' });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Default server error — don't expose details in production
  res.status(500).json({
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An internal server error occurred. Please try again.',
  });
};

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
