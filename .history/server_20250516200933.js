// Main server file for Wirebase
try {
  // Try to load dotenv if available
  const dotenv = require('dotenv');
  dotenv.config();
  console.log('Environment variables loaded from .env file');
} catch (err) {
  console.warn('dotenv module not found, using existing environment variables');
}

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
const fs = require('fs');
const { supabase, supabaseAdmin } = require('./server/utils/database');

// Configure Knex with optimized connection pooling and better error handling
// Make knex instance globally available for utilities
global.knex = require('knex')({
  client: 'pg',
  connection: {
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
          console.error('Error in database connection afterCreate:', err);
          done(err, conn);
        } else {
          console.log('Database connection established in afterCreate');
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
  console.error('Unexpected database error:', err);
  console.error('Error details:', {
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
      await global.knex.raw('SELECT 1');
      console.log('Database connection established successfully');
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${attempt}/${retries} failed:`, err.message);

      if (attempt < retries) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('All database connection attempts failed');
        // Only exit in development to assist with debugging
        if (process.env.NODE_ENV !== 'production') {
          process.exit(-1);
        }
        return false;
      }
    }
  }
};

// Start the verification process
verifyDatabaseConnection();

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
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d', // Cache static assets for 7 days
  etag: true,
  lastModified: true
}));
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
    console.log('Request timed out, cleaning up uploaded file:', req.file.path);
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkError) {
      console.error('Failed to cleanup timed out upload:', unlinkError);
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
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
      console.error('Error creating upload directory:', err);
      // Fallback to system temp directory if creation fails
      const fallbackDir = path.join(require('os').tmpdir(), 'wirebase-uploads');
      try {
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        cb(null, fallbackDir);
      } catch (fallbackErr) {
        console.error('Error creating fallback upload directory:', fallbackErr);
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
const { queryTimeoutMiddleware, transactionTimeoutMiddleware } = require('./server/middleware/query-timeout');

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

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  console.log('Referrer:', req.get('Referrer') || 'None');
  console.log('User Agent:', req.get('User-Agent'));

  res.status(404).render('error', {
    title: '404 - Page Not Found',
    errorCode: 404,
    message: 'The page you are looking for does not exist.',
    theme: 'dark-dungeon'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.name, err.message);
  console.error('Error Stack:', err.stack);
  console.error('Request URL:', req.method, req.url);
  console.error('Request Headers:', JSON.stringify(req.headers, null, 2));

  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).render('error', {
    title: '500 - Server Error',
    errorCode: 500,
    message: 'Something went wrong on our end.',
    theme: 'broken-window'
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, sending alerts, etc.
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Graceful shutdown or recovery logic
  if (process.env.NODE_ENV === 'production') {
    // In production, gracefully shut down to prevent undefined state
    console.error('Shutting down due to uncaught exception');
    gracefulShutdown();
  }
});

// Graceful shutdown function to properly close database connections
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');

  try {
    // Stop health checks and leak detection
    console.log('Stopping database monitoring...');
    clearInterval(healthCheckTimer);
    clearInterval(leakDetectionTimers.checkTimer);
    clearInterval(leakDetectionTimers.fixTimer);

    // Fix any connection leaks before shutdown
    console.log('Checking for connection leaks before shutdown...');
    await dbLeakDetector.fixLeaks(true);

    // Close server to stop accepting new connections
    console.log('Closing HTTP server...');
    await new Promise((resolve) => {
      server.close(resolve);
    });

    // Close database connections
    console.log('Closing database connections...');
    await global.knex.destroy();
    console.log('Database connections closed successfully');

    // Exit process
    console.log('Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize timers for health checks and leak detection
let healthCheckTimer;
let leakDetectionTimers;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Wirebase server running in ${NODE_ENV} mode on port ${PORT}`);

  // Start database monitoring after server starts
  console.log('Starting database monitoring...');

  // Start health checks (every 60 seconds)
  healthCheckTimer = dbHealth.startPeriodicHealthChecks(global.knex, 60000);

  // Start leak detection (check every 30 seconds, fix every 5 minutes)
  leakDetectionTimers = dbLeakDetector.startLeakDetection(global.knex, 30000, 300000);

  // Initialize pool monitoring
  dbMonitor.setupPoolMonitoring(global.knex);
});

// Add server timeout to prevent hanging connections
server.timeout = 120000; // 2 minutes

// Export knex instance and monitoring utilities for use in other modules
module.exports = {
  knex: global.knex,
  dbMonitor,
  dbHealth,
  dbErrorHandler,
  dbLeakDetector
};
