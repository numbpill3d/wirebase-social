const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../utils/passport-config');
const ScrapyardItem = require('../models/ScrapyardItem');
const Collection = require('../models/Collection');
const Wishlist = require('../models/Wishlist');
const Transaction = require('../models/Transaction');
const Purchase = require('../models/Purchase');
const User = require('../models/User');

/**
 * Get marketplace items with filtering
 */
router.get('/items', async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      sort: req.query.sort || 'newest'
    };
    
    if (req.query.category) options.category = req.query.category;
    if (req.query.minPrice) options.minPrice = parseInt(req.query.minPrice);
    if (req.query.maxPrice) options.maxPrice = parseInt(req.query.maxPrice);
    if (req.query.search) options.search = req.query.search;
    if (req.query.tags) options.tags = req.query.tags.split(',');
    
    const items = await ScrapyardItem.findMarketplaceItems(options);
    
    res.json({
      success: true,
      items,
      meta: {
        limit: options.limit,
        offset: options.offset,
        total: await ScrapyardItem.countDocuments({ marketplace_status: 'available' })
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketplace items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Get collections
 */
router.get('/collections', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const collections = await Collection.findPublic(limit);
    
    res.json({ success: true, collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Get trending items
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const items = await ScrapyardItem.findMarketplaceItems({
      limit,
      sort: 'popular'
    });
    
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching trending items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Get items a user is selling
 */
router.get('/user/:id/selling', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get items the user is selling
    const items = [];
    for (const itemId of user.sellingItems || []) {
      const item = await ScrapyardItem.findById(itemId);
      if (item && item.marketplaceStatus === 'available') {
        items.push(item);
      }
    }
    
    res.json({
      success: true,
      items,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Error fetching user selling items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user selling items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Get current WIR exchange rate
 */
router.get('/wir/rate', async (req, res) => {
  try {
    // In a real implementation, this might be dynamic or stored in a database
    const rate = {
      lootTokensToWir: 1, // 1 loot token = 1 WIR
      wirToLootTokens: 1  // 1 WIR = 1 loot token
    };
    
    res.json({ success: true, rate });
  } catch (error) {
    console.error('Error fetching WIR rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch WIR rate',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Check if an item is in user's wishlist
 */
router.get('/wishlist/check/:itemId', ensureAuthenticated, async (req, res) => {
  try {
    const isInWishlist = await Wishlist.isItemInUserWishlist(req.user.id, req.params.itemId);
    res.json({ success: true, isInWishlist });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Get user's collections for dropdown
 */
router.get('/user/collections', ensureAuthenticated, async (req, res) => {
  try {
    const collections = await Collection.findByCreator(req.user.id);
    
    res.json({
      success: true,
      collections: collections.map(c => ({
        id: c.id,
        name: c.name,
        itemCount: c.items.length
      }))
    });
  } catch (error) {
    console.error('Error fetching user collections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user collections',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Get user's WIR balance
 */
router.get('/user/wir/balance', ensureAuthenticated, async (req, res) => {
  try {
    res.json({ success: true, balance: req.user.wirBalance });
  } catch (error) {
    console.error('Error fetching WIR balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch WIR balance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

module.exports = router;