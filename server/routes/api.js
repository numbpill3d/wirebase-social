const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ScrapyardItem = require('../models/ScrapyardItem');
const MarketItem = require('../models/MarketItem');
const Streetpass = require('../models/Streetpass');

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
};

// GET all users (public API)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('username displayName avatar customGlyph statusMessage')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET user by username
router.get('/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username displayName avatar customGlyph statusMessage createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET current user (authenticated)
router.get('/me', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all scrapyard items (public API)
router.get('/scrapyard', async (req, res) => {
  try {
    const category = req.query.category;
    const query = category ? { category } : {};

    const items = await ScrapyardItem.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('creator', 'username displayName avatar customGlyph');

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET scrapyard item by ID
router.get('/scrapyard/:id', async (req, res) => {
  try {
    const item = await ScrapyardItem.findById(req.params.id)
      .populate('creator', 'username displayName avatar customGlyph');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET marketplace items with filters (for lazy loading)
router.get('/market/items', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Extract filter parameters
    const filters = {
      category: req.query.category,
      search: req.query.search,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : null,
      sort: req.query.sort || 'newest',
      tags: req.query.tags
    };

    // Add user ID to filters if sort is 'recommended' and user is authenticated
    if (filters.sort === 'recommended' && req.isAuthenticated()) {
      filters.userId = req.user.id;
    }

    // Get items with filters
    const { items, total } = await MarketItem.getFiltered(filters, limit, offset);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    res.json({
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasPrev: page > 1,
        hasNext: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching market items:', error);
    res.status(500).json({ error: 'An error occurred while fetching marketplace items' });
  }
});

// GET marketplace item by ID
router.get('/market/items/:id', async (req, res) => {
  try {
    const item = await MarketItem.getById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching market item:', error);
    res.status(500).json({ error: 'An error occurred while fetching the marketplace item' });
  }
});

// === Streetpass API Endpoints ===

/**
 * POST /api/streetpass/visit
 * Record a visit to a user's profile
 */
router.post('/streetpass/visit', ensureAuthenticated, async (req, res) => {
  try {
    const { profileId, emote } = req.body;
    const visitorId = req.user.id;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: 'Profile ID is required'
      });
    }

    // Record the visit
    const result = await Streetpass.recordVisit(visitorId, profileId, emote);

    res.json(result);
  } catch (error) {
    console.error('Error recording streetpass visit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record visit',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * GET /api/streetpass/visitors/:profileId
 * Get recent visitors for a profile
 */
router.get('/streetpass/visitors/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Get visitors
    const visitors = await Streetpass.getVisitors(profileId, limit);

    res.json({
      success: true,
      visitors
    });
  } catch (error) {
    console.error('Error getting streetpass visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get visitors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * PUT /api/streetpass/emote
 * Update the emote for a visit
 */
router.put('/streetpass/emote', ensureAuthenticated, async (req, res) => {
  try {
    const { visitId, emote } = req.body;

    if (!visitId || !emote) {
      return res.status(400).json({
        success: false,
        message: 'Visit ID and emote are required'
      });
    }

    // Update the emote
    const result = await Streetpass.updateEmote(visitId, emote);

    res.json(result);
  } catch (error) {
    console.error('Error updating streetpass emote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emote',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
