const { createLogger, format, transports } = require('winston');

const isDebug = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production';

const logger = createLogger({
  level: isDebug ? 'debug' : process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level}] ${message}${metaString}`;
    })
  ),
  transports: [new transports.Console()]
});

module.exports = logger;
