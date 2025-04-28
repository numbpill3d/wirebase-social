// Main server file for Wirebase
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const passport = require('passport');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { supabase, supabaseAdmin } = require('./server/utils/database');
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
  pool: { min: 0, max: 7 }
}).on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
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

// Session configuration with Knex store
const store = new KnexSessionStore({
  knex,
  tablename: 'sessions',
  createtable: true,
  clearInterval: 60000,
  sidfieldname: 'sid'
});

app.use(session({
  store: store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  } 
}));

// Initialize passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Setup file storage for user uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create directories for different asset types
    const userId = req.user ? req.user.id : 'anonymous';
    const dir = path.join(__dirname, 'public/uploads', userId);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
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
  res.locals.pageTheme = 'dark-dungeon';
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

// Start server
app.listen(PORT, () => {
  console.log(`Wirebase server running in ${NODE_ENV} mode on port ${PORT}`);
});
