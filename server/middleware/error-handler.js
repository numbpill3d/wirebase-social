// Custom error-handling middleware
const logger = require('../utils/logger');
module.exports = (err, req, res, next) => {
  logger.error('Server Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || 'Something went wrong on our end.';

  if (req.accepts('json') && !req.accepts('html')) {
    return res.status(status).json({ error: message });
  }

  res.status(status).render('error', {
    title: `${status} - ${status === 404 ? 'Not Found' : 'Server Error'}`,
    errorCode: status,
    message,
    theme: status === 500 ? 'broken-window' : 'dark-dungeon'
  });
};
