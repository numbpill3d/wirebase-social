const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ScrapyardItem = require('../models/ScrapyardItem');

// Home page route
router.get('/', async (req, res) => {
  try {
    const [recentUsers, recentItems, featuredItems] = await Promise.all([
      User.findRecent(),
      Item.findRecent(),
      Item.findFeatured()
    ]).catch(err => {
      throw new Error('Failed to fetch homepage data: ' + err.message);
    });

    res.render('index', {
      title: 'Wirebase - Medieval Dungeon Fantasy Social Platform',
      recentUsers,
      recentItems,
      featuredItems,
      pageTheme: 'dark-dungeon'
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
      ScrapyardItem.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('creator', 'username displayName avatar customGlyph')
        .select('title category previewImage createdAt creator')
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
    console.error(err);
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
