let logger;

if (process.env.LOGFLARE_API_KEY && process.env.LOGFLARE_SOURCE_TOKEN) {
  const pino = require('pino');
  const { createPinoLogflare } = require('pino-logflare');

  const logflare = createPinoLogflare({
    apiKey: process.env.LOGFLARE_API_KEY,
    sourceToken: process.env.LOGFLARE_SOURCE_TOKEN,
  });

  const {stream} = logflare;
  logger = pino({ level: process.env.LOG_LEVEL || 'info' }, stream);

  console.log('Using Pino with Logflare for logging');
} else {
  const { createLogger, format, transports } = require('winston');

  const level = process.env.DEBUG === 'true' ? 'debug' : process.env.LOG_LEVEL || 'info';

  const transportList = [new transports.Console()];
  if (process.env.LOG_FILE_PATH) {
    try {
      transportList.push(new transports.File({ filename: process.env.LOG_FILE_PATH }));
    } catch (err) {
      console.error(`Failed to create log file transport: ${err.message}`);
    }
  }

  logger = createLogger({
    level,
    format: format.combine(
      format.timestamp(),
      format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
    ),
    transports: transportList
  });

  if (process.env.LOG_FILE_PATH) {
    console.log(`Using Winston for logging to console and ${process.env.LOG_FILE_PATH}`);
  } else {
    console.log('Using Winston for logging');
  }
}

module.exports = logger;
