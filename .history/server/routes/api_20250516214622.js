const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ScrapyardItem = require('../models/ScrapyardItem');
const MarketItem = require('../models/MarketItem');

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

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;