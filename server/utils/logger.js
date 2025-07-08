const { createLogger, format, transports } = require('winston');

const level = process.env.DEBUG ? 'debug' : process.env.LOG_LEVEL || 'info';

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
  ),
  transports: [new transports.Console()]
});

module.exports = logger;
