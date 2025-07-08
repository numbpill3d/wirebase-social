let logger;

if (process.env.LOGFLARE_API_KEY && process.env.LOGFLARE_SOURCE_TOKEN) {
  const pino = require('pino');
  const { createPinoLogflare } = require('pino-logflare');

  const logflare = createPinoLogflare({
    apiKey: process.env.LOGFLARE_API_KEY,
    sourceToken: process.env.LOGFLARE_SOURCE_TOKEN,
  });

  const stream = logflare.stream;
  logger = pino({ level: process.env.LOG_LEVEL || 'info' }, stream);

  console.log('Using Pino with Logflare for logging');
} else {
  const { createLogger, format, transports } = require('winston');

  const level = process.env.DEBUG === 'true' ? 'debug' : process.env.LOG_LEVEL || 'info';

  logger = createLogger({
    level,
    format: format.combine(
      format.timestamp(),
      format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
    ),
    transports: [new transports.Console()]
  });

  console.log('Using Winston for logging');
}

module.exports = logger;
