// Main server file for Wirebase
const logger = require("./server/utils/logger");

let dotenvWarned = false;
try {
  // Try to load dotenv if available
  const dotenv = require('dotenv');
  dotenv.config();
  logger.info('Environment variables loaded from .env file');
} catch (err) {
  if (!dotenvWarned) {
    logger.warn('dotenv module not found, using existing environment variables');
    dotenvWarned = true;
  }
}

const { validateEnv } = require('./server/utils/env-check');
if (!validateEnv()) {
  logger.error('Environment validation failed. Starting minimal server instead.');
  require('./minimal-server');
  return;
}

// Verify required environment variables
const { checkRequiredEnv } = require('./server/utils/env-check');
checkRequiredEnv();

// Import performance optimization utilities
const {
  compressionMiddleware,
  resourceHints,
  cacheControl
} = require('./server/utils/performance');

// Import security utilities
const {
  helmetMiddleware,
  rateLimiter,
  xssMiddleware
} = require('./server/utils/security');

const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const passport = require('passport');
const path = require('path');
const multer = require('multer');
const csurf = require('csurf');
const fs = require('fs');
const { supabase, supabaseAdmin } = require('./server/utils/database');

// Configure Knex with optimized connection pooling and better error handling
// Make knex instance globally available for utilities
// Prefer the full database connection string if provided (e.g. from Render)
// to avoid constructing credentials manually from Supabase values. This helps
// prevent connection failures during deployment.
global.knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: new URL(process.env.SUPABASE_URL).hostname,
    port: 5432,
    user: 'postgres',
    password: process.env.SUPABASE_SERVICE_KEY.split('.')[0],
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 0, // Start with no connections
    max: 5, // Reduced max connections to prevent pool exhaustion
    // Add connection timeout handling
    acquireTimeoutMillis: 60000, // Increased to 60 seconds
    createTimeoutMillis: 60000, // Increased to 60 seconds
    idleTimeoutMillis: 60000, // Reduced to 1 minute to release idle connections faster
    // Add automatic reconnection
    afterCreate: (conn, done) => {
      conn.query('SELECT 1', err => {
        if (err) {
          logger.error('Error in database connection afterCreate:', err);
          done(err, conn);
        } else {
          logger.debug('Database connection established in afterCreate');
          done(null, conn);
        }
      });
    },
    // Add destroy handler to ensure connections are properly closed
    destroyTimeoutMillis: 5000, // 5 seconds to wait for connections to close
  },
  // Add better error handling
  acquireConnectionTimeout: 60000 // Increased to 60 seconds
});

// Add better error handling with detailed logging
global.knex.on('error', (err) => {
  logger.error('Unexpected database error:', err);
  logger.error('Error details:', {
    code: err.code,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Log error but don't exit process in production to maintain uptime
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

// Verify database connection with retry logic
const verifyDatabaseConnection = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Try using Supabase first
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        // If Supabase fails, try Knex as fallback
        await global.knex.raw('SELECT 1');
      }
      logger.info('Database connection established successfully');
      return true;
    } catch (err) {
      logger.error(`Database connection attempt ${attempt}/${retries} failed:`, err.message);

      if (attempt < retries) {
        logger.debug(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('All database connection attempts failed');
        // Don't exit in production to maintain service availability
        if (process.env.NODE_ENV !== 'production') {
          logger.warn('Database connection failed in development mode. Check your database configuration.');
          // Don't exit to allow for mock data or fallback mechanisms
        }
        return false;
      }
    }
  }
};

// Helper function to start the server after verifying DB connection
let server; // will hold HTTP server instance for graceful shutdown

const startServer = async () => {
  try {
    const verified = await verifyDatabaseConnection();
    if (!verified) {
      logger.error('Database connection could not be verified. Exiting...');
      process.exit(1);
    }

    server = app.listen(PORT, () => {
      logger.info(`Wirebase server running in ${NODE_ENV} mode on port ${PORT}`);

      // Start database monitoring after server starts
      logger.debug('Starting database monitoring...');

      // Start health checks (every 60 seconds)
      healthCheckTimer = dbHealth.startPeriodicHealthChecks(60000);

      // Start leak detection (check every 30 seconds, fix every 5 minutes)
      leakDetectionTimers = dbLeakDetector.startLeakDetection(null, 30000, 300000);
    });

    // Add server timeout to prevent hanging connections
    server.timeout = 120000; // 2 minutes
  } catch (err) {
    logger.error('Failed to initialize and start server:', err);
    process.exit(1);
  }
};

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure handlebars as the template engine
app.engine('handlebars', engine({
  defaultLayout: 'main',
  helpers: require('./server/utils/handlebars-helpers')
}));
app.set('view engine', 'handlebars');
app.set('views', './server/views');

// Middleware
app.use(helmetMiddleware); // Enhanced security headers
app.use(compressionMiddleware); // Compress responses
app.use(resourceHints); // Add resource hints
app.use(xssMiddleware); // Prevent XSS attacks
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cacheControl); // Add cache control headers

// Apply rate limiting to API routes
app.use('/api', rateLimiter);

// Add request timeout middleware
const timeout = require('connect-timeout');

// Use a longer timeout for production
app.use(timeout(process.env.NODE_ENV === 'production' ? '30s' : '15s'));

// Handle timeouts
app.use((req, res, next) => {
  if (!req.timedout) {
    next();
  }
});

// Clean up any unfinished uploads on timeout
app.use((err, req, res, next) => {
  if (err && req.timedout && req.file && req.file.path) {
    logger.debug('Request timed out, cleaning up uploaded file:', req.file.path);
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkError) {
      logger.error('Failed to cleanup timed out upload:', unlinkError);
    }
  }
  next(err);
});

// Add response time header
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const ms = (seconds * 1000) + (nanoseconds / 1000000);
    res.setHeader('X-Response-Time', `${ms.toFixed(2)}ms`);
  });

  next();
});

// Session configuration with Knex store - optimized settings
const store = new KnexSessionStore({
  knex: global.knex, // Use the same knex instance to avoid creating multiple pools
  tablename: 'sessions',
  createtable: true,
  // Fix potential memory leak with proper cleanup
  clearInterval: 86400000, // Clear expired sessions daily (24 hours)
  sidfieldname: 'sid',
  // Performance optimizations
  disableKeepExtensions: true, // Disable extensions to reduce DB load
  disableReaper: false, // Keep reaper to clean up old sessions
  reapInterval: 43200000, // Reap every 12 hours (reduced frequency further)
  reapMaxConcurrent: 1, // Reduce to 1 concurrent delete operation
  // Serialize/deserialize function options
  serializer: JSON.stringify,
  deserializer: JSON.parse
  // Remove separate pool configuration to use the main knex pool
});

app.use(session({
  store: store,
  secret: process.env.SESSION_SECRET || 'wirebase-dev-secret',
  resave: false,
  saveUninitialized: false, // Only save sessions when necessary
  rolling: false, // Disable rolling to reduce database writes
  name: 'wirebase.sid', // Custom cookie name for better security
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true, // Prevent client-side JS from accessing cookie
    path: '/'
  },
  // Add touch option to reduce database writes
  touchAfter: 24 * 3600 // Only update session once per day
}));

// Initialize passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// CSRF protection (disabled during tests)
if (NODE_ENV !== 'test') {
  app.use(csurf());
  app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
  });
}

// Setup file storage for user uploads
const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    const userId = req.user ? req.user.id : 'anonymous';
    // Use tmp directory for Render compatibility
    const baseDir = process.env.NODE_ENV === 'production' ? '/tmp' : __dirname;
    const dir = path.join(baseDir, 'public/uploads', userId);

    // Add error handling for directory creation
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      logger.error('Error creating upload directory:', err);
      // Fallback to system temp directory if creation fails
      const fallbackDir = path.join(require('os').tmpdir(), 'wirebase-uploads');
      try {
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        cb(null, fallbackDir);
      } catch (fallbackErr) {
        logger.error('Error creating fallback upload directory:', fallbackErr);
        cb(new Error('Failed to create upload directory'));
      }
    }
  },
  filename: function (_req, file, cb) {
    // Add file type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
      return;
    }
    cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_UPLOAD_SIZE || 5242880, // 5MB
    files: 1
  }
});
app.locals.upload = upload; // Make upload available to routes

// Passport configuration
require('./server/utils/passport-config')(passport);

// Global middleware for user information
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.isProduction = process.env.NODE_ENV === 'production';
  next();
});

// Set default theme
app.use((req, res, next) => {
  // Check user preference first, then session, then default
  const userTheme = req.user?.preferences?.theme;
  const sessionTheme = req.session?.theme;
  const defaultTheme = process.env.DEFAULT_THEME || 'dark-dungeon';

  res.locals.pageTheme = userTheme || sessionTheme || defaultTheme;
  next();
});

// Import database utilities
const dbMonitor = require('./server/utils/db-monitor');
const dbHealth = require('./server/utils/db-health');
const dbErrorHandler = require('./server/utils/db-error-handler');
const dbLeakDetector = require('./server/utils/db-leak-detector');
const memoryMonitor = require('./server/utils/memory-monitor');
const errorHandler = require('./server/middleware/error-handler');

const { queryTimeoutMiddleware, transactionTimeoutMiddleware } = require('./server/middleware/query-timeout');

// Initialize database utilities with knex instance
dbMonitor.initialize(global.knex);
dbHealth.initialize(global.knex);
dbErrorHandler.initialize(global.knex);
dbLeakDetector.initialize(global.knex);

// Setup pool monitoring after initialization
dbMonitor.setupPoolMonitoring();

// Apply database middleware with knex instance
app.use(queryTimeoutMiddleware(global.knex, 30000)); // 30 second query timeout
app.use(transactionTimeoutMiddleware(global.knex, 60000)); // 60 second transaction timeout
app.use(dbErrorHandler.errorHandlerMiddleware());

// Routes
app.use('/', require('./server/routes/index'));
app.use('/users', require('./server/routes/users'));
app.use('/profile', require('./server/routes/profile'));
app.use('/scrapyard', require('./server/routes/scrapyard'));
app.use('/feed', require('./server/routes/feed'));
app.use('/api', require('./server/routes/api'));
app.use('/forum', require('./server/routes/forum'));
app.use('/admin/api', require('./server/routes/admin-api'));

// Vivid Market routes
app.use('/market', require('./server/routes/market'));
app.use('/market/user', require('./server/routes/user-market'));
app.use('/api/market', require('./server/routes/market-api'));

// Serve static assets after routes so dynamic pages take precedence
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d', // Cache static assets for 7 days
  etag: true,
  lastModified: true
}));

// 404 handler
app.use((req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('404 Not Found:', req.method, req.url);
    logger.debug('Referrer:', req.get('Referrer') || 'None');
    logger.debug('User Agent:', req.get('User-Agent'));
  }

  res.status(404).render('error', {
    title: '404 - Page Not Found',
    errorCode: 404,
    message: 'The page you are looking for does not exist.',
    theme: 'dark-dungeon'
  });
});

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('error', {
      title: 'Invalid CSRF Token',
      errorCode: 403,
      message: 'Form tampered with or session expired.',
      theme: 'locked-dungeon'
    });
  }
  next(err);
});

// Error handler
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, sending alerts, etc.
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Graceful shutdown or recovery logic
  if (process.env.NODE_ENV === 'production') {
    // In production, gracefully shut down to prevent undefined state
    logger.error('Shutting down due to uncaught exception');
    gracefulShutdown();
  }
});

// Graceful shutdown function to properly close database connections
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  try {
    // Stop health checks and leak detection
    logger.debug('Stopping database monitoring...');
    if (healthCheckTimer && typeof healthCheckTimer.stop === 'function') {
      healthCheckTimer.stop();
    }
    clearInterval(leakDetectionTimers.checkTimer);
    clearInterval(leakDetectionTimers.fixTimer);
    memoryMonitor.stop();

    // Fix any connection leaks before shutdown
    logger.debug('Checking for connection leaks before shutdown...');
    await dbLeakDetector.fixLeaks(true);

    // Close server to stop accepting new connections
    logger.info('Closing HTTP server...');
    await new Promise((resolve) => {
      server.close(resolve);
    });

    // Close database connections
    logger.info('Closing database connections...');
    await global.knex.destroy();
    logger.info('Database connections closed successfully');

    // Exit process
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize timers for health checks and leak detection
let healthCheckTimer;
let leakDetectionTimers;


// Start health checks (every 60 seconds)
healthCheckTimer = dbHealth.startPeriodicHealthChecks(60000);

// Start leak detection (check every 30 seconds, fix every 5 minutes)
leakDetectionTimers = dbLeakDetector.startLeakDetection(null, 30000, 300000);

// Start memory monitoring
memoryMonitor.start();

// Start server after verifying database connection
startServer();



// Export knex instance and monitoring utilities for use in other modules
module.exports = {
  knex: global.knex,
  dbMonitor,
  dbHealth,
  dbErrorHandler,
  dbLeakDetector
};
