const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ScrapyardItem = require('../models/ScrapyardItem');

// Enhanced error middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const errorTypes = {
    'ValidationError': { status: 400, theme: 'broken-scroll' },
    'AuthenticationError': { status: 401, theme: 'locked-dungeon' },
    'NotFoundError': { status: 404, theme: 'empty-chest' },
    'default': { status: 500, theme: 'broken-window' }
  };

  const { status, theme } = errorTypes[err.name] || errorTypes.default;

  res.status(status).render('error', {
    title: `${status} - ${err.message || 'Server Error'}`,
    errorCode: status,
    message: err.message || 'An unexpected error occurred',
    theme,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
};

// Home page route
router.get('/', async (req, res) => {
  try {
    // Get data for widgets and main content
    const [
      recentUsers,
      recentItems,
      featuredItems,
      userCount,
      itemCount,
      recentActivity
    ] = await Promise.all([
      User.findRecent(),
      ScrapyardItem.findRecent(),
      ScrapyardItem.findFeatured(),
      User.countDocuments(),
      ScrapyardItem.countDocuments(),
      User.find({}, { sort: { lastActive: -1 }, limit: 10 })
    ]).catch(err => {
      throw new Error('Failed to fetch homepage data: ' + err.message);
    });

    // Calculate site mood based on activity
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Count active users in the last 24 hours
    const activeUsers = recentActivity.filter(user =>
      user.lastActive && new Date(user.lastActive) > oneDayAgo
    ).length;
    
    // Determine site mood based on activity level
    let siteMood = 'neutral';
    if (activeUsers > 7) siteMood = 'energetic';
    else if (activeUsers > 4) siteMood = 'active';
    else if (activeUsers > 2) siteMood = 'calm';
    else siteMood = 'quiet';

    // Generate hourly traffic data (mock data for now)
    const hourlyTraffic = Array.from({ length: 24 }, (_, i) => {
      // Generate random but somewhat realistic traffic pattern
      let value = Math.floor(Math.random() * 10);
      // Increase values during typical high-traffic hours
      if (i >= 8 && i <= 11) value += 5; // Morning peak
      if (i >= 19 && i <= 22) value += 8; // Evening peak
      return { hour: i, value };
    });

    res.render('index', {
      title: 'Wirebase - Medieval Dungeon Fantasy Social Platform',
      recentUsers,
      recentItems,
      featuredItems,
      pageTheme: 'dark-dungeon',
      // Widget data
      stats: {
        userCount,
        itemCount,
        threadCount: Math.floor(itemCount * 1.5), // Mock data for now
        commentCount: Math.floor(itemCount * 4.2) // Mock data for now
      },
      traffic: {
        hourlyData: hourlyTraffic,
        peakHour: hourlyTraffic.reduce((max, hour) => hour.value > max.value ? hour : max, { value: 0 }).hour
      },
      activity: {
        recentUsers: recentActivity,
        activeUsers,
        onlineUsers: Math.min(Math.floor(activeUsers * 0.6), activeUsers) // Estimate of currently online users
      },
      mood: {
        current: siteMood,
        trend: activeUsers > 5 ? 'rising' : 'falling',
        intensity: Math.min(Math.floor((activeUsers / 10) * 100), 100)
      }
    });
  } catch (err) {
    console.error('Homepage error:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading the home page',
      theme: 'broken-window'
    });
  }
});

// About page route
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Wirebase',
    pageTheme: 'dark-dungeon'
  });
});

// Global discovery feed
router.get('/discover', async (req, res) => {
  try {
    if (process.env.DEBUG) console.log('Discover route accessed');
    // Validate and sanitize pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Get recent updates from users and Scrapyard
    const recentUpdates = await Promise.all([
      // Recent profile updates
      User.find()
        .sort({ lastActive: -1 })
        .skip(skip)
        .limit(limit)
        .select('username displayName avatar customGlyph statusMessage lastActive'),

      // Recent Scrapyard submissions
      ScrapyardItem.find({}, {
        sort: { createdAt: -1 },
        skip,
        limit
      })
    ]);

    // Count total documents for pagination
    const [userCount, itemCount] = await Promise.all([
      User.countDocuments(),
      ScrapyardItem.countDocuments()
    ]);

    // Merge and sort updates by date
    const updates = [
      ...recentUpdates[0].map(user => ({
        type: 'profile',
        item: user,
        date: user.lastActive
      })),
      ...recentUpdates[1].map(item => ({
        type: 'scrapyard',
        item: item,
        date: item.createdAt
      }))
    ].sort((a, b) => b.date - a.date)
    .slice(0, limit);

    const totalPages = Math.ceil(Math.max(userCount, itemCount) / limit);

    if (process.env.DEBUG) console.log('Attempting to render discover template');
    res.render('discover', {
      title: 'Discover - Wirebase',
      updates,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      pageTheme: 'dark-dungeon'
    });
  } catch (err) {
    console.error('Error in discover route:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading the discovery feed',
      theme: 'broken-window'
    });
  }
});

// Browser compatibility page
router.get('/compatibility', (req, res) => {
  res.render('compatibility', {
    title: 'Browser Compatibility - Wirebase',
    pageTheme: 'retro-windows'
  });
});

// FAQ page
router.get('/faq', (req, res) => {
  res.render('faq', {
    title: 'FAQ - Wirebase',
    pageTheme: 'dark-dungeon'
  });
});

// Privacy policy
router.get('/privacy', (req, res) => {
  res.render('privacy', {
    title: 'Privacy Policy - Wirebase',
    pageTheme: 'retro-windows'
  });
});

// Terms of service
router.get('/terms', (req, res) => {
  res.render('terms', {
    title: 'Terms of Service - Wirebase',
    pageTheme: 'retro-windows'
  });
});

module.exports = router;
