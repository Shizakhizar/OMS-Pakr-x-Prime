function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error.';

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    ok: false,
    message,
    details: error.details || null,
  });
}

module.exports = {
  errorHandler,
};
