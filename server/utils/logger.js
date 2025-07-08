const pino = require('pino');

let logger;

if (process.env.LOGFLARE_API_KEY && process.env.LOGFLARE_SOURCE_TOKEN) {
  const { createPinoLogflare } = require('pino-logflare');
  const logflare = createPinoLogflare({
    apiKey: process.env.LOGFLARE_API_KEY,
    sourceToken: process.env.LOGFLARE_SOURCE_TOKEN,
  });
  const stream = logflare.stream;
  logger = pino({ level: process.env.LOG_LEVEL || 'info' }, stream);
} else {
  logger = pino({ level: process.env.LOG_LEVEL || 'info' });
}

module.exports = logger;
