/**
 * Market API Routes
 * API endpoints for the Vivid Market
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureApiAuth } = require('../utils/auth-helpers');
const { supabase } = require('../utils/database');
const { apiCache } = require('../utils/performance');

// Market Models
const MarketItem = require('../models/MarketItem');
const Collection = require('../models/Collection');
const WIRTransaction = require('../models/WIRTransaction');

/**
 * GET /api/market/items
 * Get marketplace items with filters
 */
router.get('/items', apiCache(60), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const offset = (page - 1) * limit;

    // Extract filter parameters
    const filters = {
      category: req.query.category,
      search: req.query.search,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : null,
      sort: req.query.sort || 'newest',
      tags: req.query.tags,
      creator: req.query.creator
    };

    // Get items with filters
    const { items, total } = await MarketItem.getFiltered(filters, limit, offset);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('API Error - Get market items:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching market items'
    });
  }
});

/**
 * GET /api/market/items/:id
 * Get a specific marketplace item
 */
router.get('/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;

    // Get the item details
    const item = await MarketItem.getById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Increment view count
    await MarketItem.incrementViews(itemId);

    res.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('API Error - Get market item:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the item'
    });
  }
});

/**
 * GET /api/market/categories
 * Get all marketplace categories
 */
router.get('/categories', apiCache(600), async (req, res) => {
  try {
    const categories = await MarketItem.getCategories();

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('API Error - Get market categories:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching categories'
    });
  }
});

/**
 * GET /api/market/tags
 * Get popular tags
 */
router.get('/tags', apiCache(600), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tags = await MarketItem.getPopularTags(limit);

    res.json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('API Error - Get popular tags:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching tags'
    });
  }
});

/**
 * GET /api/market/collections
 * Get collections with filters
 */
router.get('/collections', apiCache(60), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Extract filter parameters
    const filters = {
      creator: req.query.creator,
      search: req.query.search,
      sort: req.query.sort || 'newest'
    };

    // Get collections with filters
    const { collections, total } = await Collection.getFiltered(filters, limit, offset);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      collections,
      pagination: {
        currentPage: page,
        totalPages,
        totalCollections: total,
        collectionsPerPage: limit
      }
    });
  } catch (error) {
    console.error('API Error - Get collections:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching collections'
    });
  }
});

/**
 * GET /api/market/collections/:id
 * Get a specific collection
 */
router.get('/collections/:id', async (req, res) => {
  try {
    const collectionId = req.params.id;

    // Get the collection details
    const collection = await Collection.getById(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Check if collection is private and not owned by the current user
    if (!collection.isPublic && (!req.isAuthenticated() || req.user.id !== collection.creator.id)) {
      return res.status(403).json({
        success: false,
        message: 'This collection is private'
      });
    }

    // Increment view count
    await Collection.incrementViews(collectionId);

    res.json({
      success: true,
      collection
    });
  } catch (error) {
    console.error('API Error - Get collection:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the collection'
    });
  }
});

/**
 * GET /api/market/featured
 * Get featured items and collections
 */
router.get('/featured', apiCache(300), async (req, res) => {
  try {
    // Get featured items (limit to 6)
    const featuredItems = await MarketItem.getFeatured(6);

    // Get featured collections (limit to 3)
    const featuredCollections = await Collection.getFeatured(3);

    res.json({
      success: true,
      featuredItems,
      featuredCollections
    });
  } catch (error) {
    console.error('API Error - Get featured content:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching featured content'
    });
  }
});

/**
 * GET /api/market/stats
 * Get marketplace statistics
 */
router.get('/stats', apiCache(300), async (req, res) => {
  try {
    // Get market stats
    const itemCount = await MarketItem.getCount();
    const collectionCount = await Collection.getCount();
    const userCount = await MarketItem.getCreatorCount();
    const totalTransactions = await WIRTransaction.getCount();

    // Get top categories
    const topCategories = await MarketItem.getTopCategories(5);

    // Get top creators
    const topCreators = await MarketItem.getTopCreators(5);

    res.json({
      success: true,
      stats: {
        itemCount,
        collectionCount,
        userCount,
        totalTransactions
      },
      topCategories,
      topCreators
    });
  } catch (error) {
    console.error('API Error - Get market stats:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching market statistics'
    });
  }
});

// === Authenticated API Routes ===

/**
 * POST /api/market/items
 * Create a new marketplace item
 */
router.post('/items', ensureApiAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      category,
      content,
      wirPrice,
      tags,
      featuredInMarket,
      previewImage
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Parse WIR price
    const price = parseInt(wirPrice) || 0;

    // Check if user has enough WIR for listing fee
    const listingFee = price > 0 ? 1 : 0;
    const featuredFee = featuredInMarket ? 5 : 0;
    const totalFee = listingFee + featuredFee;

    if (req.user.wirBalance < totalFee) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient WIR balance for listing fees'
      });
    }

    // Create the item
    const result = await MarketItem.create({
      title,
      description,
      category,
      content,
      wirPrice: price,
      tags: tags || '',
      featuredInMarket: !!featuredInMarket,
      previewImage: previewImage || '',
      creatorId: userId
    });

    if (result.success) {
      return res.json({
        success: true,
        message: 'Item created successfully',
        itemId: result.itemId,
        newBalance: result.newBalance
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to create item'
      });
    }
  } catch (error) {
    console.error('API Error - Create market item:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the item'
    });
  }
});

/**
 * PUT /api/market/items/:id
 * Update a marketplace item
 */
router.put('/items/:id', ensureApiAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const {
      title,
      description,
      category,
      wirPrice,
      tags,
      featuredInMarket,
      previewImage
    } = req.body;

    // Check if user is the creator
    const item = await MarketItem.getById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.creator.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this item'
      });
    }

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Parse WIR price
    const price = parseInt(wirPrice) || 0;

    // Check if featured status is being changed
    const featuredFee = !item.featuredInMarket && featuredInMarket ? 5 : 0;

    if (featuredFee > 0 && req.user.wirBalance < featuredFee) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient WIR balance for featured fee'
      });
    }

    // Update the item
    const result = await MarketItem.update(itemId, {
      title,
      description,
      category,
      wirPrice: price,
      tags: tags || '',
      featuredInMarket: !!featuredInMarket,
      previewImage: previewImage || item.previewImage
    }, featuredFee);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Item updated successfully',
        newBalance: result.newBalance
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to update item'
      });
    }
  } catch (error) {
    console.error('API Error - Update market item:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the item'
    });
  }
});

/**
 * DELETE /api/market/items/:id
 * Delete a marketplace item
 */
router.delete('/items/:id', ensureApiAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    // Check if user is the creator
    const item = await MarketItem.getById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.creator.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this item'
      });
    }

    // Delete the item
    await MarketItem.delete(itemId);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('API Error - Delete market item:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the item'
    });
  }
});

/**
 * POST /api/market/items/:id/purchase
 * Purchase a marketplace item
 */
router.post('/items/:id/purchase', ensureApiAuth, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;

    // Get the item details
    const item = await MarketItem.getById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user has enough WIR
    if (req.user.wirBalance < item.wirPrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient WIR balance'
      });
    }

    // Check if user already owns the item
    const alreadyOwns = await MarketItem.userOwnsItem(itemId, userId);
    if (alreadyOwns) {
      return res.status(400).json({
        success: false,
        message: 'You already own this item'
      });
    }

    // Process the purchase
    const result = await MarketItem.purchase(itemId, userId);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Purchase successful',
        newBalance: result.newBalance
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Purchase failed'
      });
    }
  } catch (error) {
    console.error('API Error - Purchase item:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during purchase'
    });
  }
});

/**
 * GET /api/market/user/items
 * Get items created by the authenticated user
 */
router.get('/user/items', ensureApiAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get items created by the user
    const items = await MarketItem.getByCreator(userId);

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('API Error - Get user items:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your items'
    });
  }
});

/**
 * GET /api/market/user/purchased
 * Get items purchased by the authenticated user
 */
router.get('/user/purchased', ensureApiAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get items purchased by the user
    const items = await MarketItem.getPurchasedByUser(userId);

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('API Error - Get user purchased items:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your purchased items'
    });
  }
});

/**
 * GET /api/market/user/wishlist
 * Get items in the authenticated user's wishlist
 */
router.get('/user/wishlist', ensureApiAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get items in the user's wishlist
    const items = await MarketItem.getWishlistByUser(userId);

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('API Error - Get user wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your wishlist'
    });
  }
});

/**
 * GET /api/market/user/collections
 * Get collections created by the authenticated user
 */
router.get('/user/collections', ensureApiAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get collections created by the user
    const collections = await Collection.getByUser(userId);

    res.json({
      success: true,
      collections
    });
  } catch (error) {
    console.error('API Error - Get user collections:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your collections'
    });
  }
});

/**
 * GET /api/market/user/wir
 * Get WIR balance and transactions for the authenticated user
 */
router.get('/user/wir', ensureApiAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's WIR transactions
    const transactions = await WIRTransaction.getByUser(userId);

    res.json({
      success: true,
      balance: req.user.wirBalance,
      lootTokens: req.user.lootTokens,
      transactions
    });
  } catch (error) {
    console.error('API Error - Get user WIR balance:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your WIR balance'
    });
  }
});

module.exports = router;