// Main server file for Wirebase
const dotenv = require('dotenv');
const helmet = require('helmet');

// Load environment variables first
dotenv.config();

// Import performance optimization utilities
const {
  compressionMiddleware,
  resourceHints,
  cacheControl
} = require('./server/utils/performance');

const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const passport = require('passport');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { supabase, supabaseAdmin } = require('./server/utils/database');

// Configure Knex with connection pooling and better error handling
const knex = require('knex')({
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
    min: 0,
    max: 7,
    // Add connection timeout handling
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    // Add automatic reconnection
    afterCreate: (conn, done) => {
      conn.query('SELECT 1', err => {
        if (err) {
          done(err, conn);
        } else {
          done(null, conn);
        }
      });
    }
  }
});

// Add better error handling
knex.on('error', (err) => {
  console.error('Unexpected database error:', err);
  // Log error but don't exit process in production to maintain uptime
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

// Verify database connection
knex.raw('SELECT 1')
  .then(() => console.log('Database connection established successfully'))
  .catch(err => {
    console.error('Failed to connect to database:', err);
    // Only exit in development to assist with debugging
    if (process.env.NODE_ENV !== 'production') {
      process.exit(-1);
    }
  });

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Add request timeout middleware
const timeout = require('connect-timeout');

app.use(timeout('15s'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// Clean up any unfinished uploads on timeout
app.use((err, req, res, next) => {
  if (req.timedout && req.file) {
    fs.unlink(req.file.path, (unlinkError) => {
      if (unlinkError) {
        console.error('Failed to cleanup timed out upload:', unlinkError);
      }
    });
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
  knex,
  tablename: 'sessions',
  createtable: true,
  // Fix potential memory leak with proper cleanup
  clearInterval: 3600000, // Clear expired sessions hourly
  sidfieldname: 'sid',
  // Performance optimizations
  disableKeepExtensions: false, // Keep extensions to avoid hitting database on every request
  disableReaper: false, // Run reaper to clean up old sessions
  reapInterval: 3600000, // Reap every hour
  reapMaxConcurrent: 10, // Maximum concurrent delete operations
  // Serialize/deserialize function options
  serializer: JSON.stringify,
  deserializer: JSON.parse
});

app.use(session({
  store: store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Only save sessions when necessary
  rolling: true, // Reset expiration timer on each request
  name: 'wirebase.sid', // Custom cookie name for better security
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true // Prevent client-side JS from accessing cookie
  }
}));

// Initialize passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Setup file storage for user uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user ? req.user.id : 'anonymous';
    const dir = path.join(__dirname, 'public/uploads', userId);

    // Add error handling for directory creation
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      cb(new Error('Failed to create upload directory'));
    }
  },
  filename: function (req, file, cb) {
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

// Routes
app.use('/', require('./server/routes/index'));
app.use('/users', require('./server/routes/users'));
app.use('/profile', require('./server/routes/profile'));
app.use('/scrapyard', require('./server/routes/scrapyard'));
app.use('/feed', require('./server/routes/feed'));
app.use('/api', require('./server/routes/api'));

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    errorCode: 404,
    message: 'The page you are looking for does not exist.',
    theme: 'dark-dungeon'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
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
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Wirebase server running in ${NODE_ENV} mode on port ${PORT}`);
});
