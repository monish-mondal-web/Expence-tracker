const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err.stack || err.message || err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'A record with these unique details already exists.',
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', '),
    });
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid resource identifier format.`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected server error occurred. Please try again.',
  });
};

module.exports = errorHandler;
