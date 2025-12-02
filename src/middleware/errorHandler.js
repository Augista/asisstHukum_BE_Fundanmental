function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === 'UnauthorizedError') return res.status(401).json({ message: 'Invalid token' });
  if (err?.status) return res.status(err.status).json({ message: err.message });
  return res.status(500).json({ message: 'Internal Server Error' });
}
module.exports = errorHandler;