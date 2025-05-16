/**
 * Vivid Market Routes
 * Main routes for the Vivid Market marketplace
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../utils/auth-helpers');
const { supabase } = require('../utils/database');
const { formatDate, truncateText } = require('../utils/format-helpers');

// Market Models
const MarketItem = require('../models/MarketItem');
const Collection = require('../models/Collection');
const WIRTransaction = require('../models/WIRTransaction');

/**
 * GET /market
 * Render the main Vivid Market page
 */
router.get('/', async (req, res) => {
  try {
    // Get market stats
    const itemCount = await MarketItem.getCount();
    const collectionCount = await Collection.getCount();
    
    // Get featured items (limit to 6)
    const featuredItems = await MarketItem.getFeatured(6);
    
    // Get recent items (limit to 8)
    const recentItems = await MarketItem.getRecent(8);
    
    // Get popular collections (limit to 4)
    const popularCollections = await Collection.getPopular(4);
    
    res.render('market/index', {
      title: 'The Vivid Market - Wirebase',
      pageDescription: 'A digital asset marketplace for the Wirebase community',
      stats: {
        itemCount,
        collectionCount
      },
      featuredItems,
      recentItems,
      popularCollections,
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error rendering market page:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while loading the marketplace.'
    });
  }
});

/**
 * GET /market/browse
 * Browse marketplace items with filters
 */
router.get('/browse', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 24; // Items per page
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
    
    // Get items with filters
    const { items, total } = await MarketItem.getFiltered(filters, limit, offset);
    
    // Get all categories for filter options
    const categories = await MarketItem.getCategories();
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    
    res.render('market/browse', {
      title: 'Browse - Vivid Market',
      pageDescription: 'Browse digital assets in the Vivid Market',
      items,
      categories,
      filters,
      pagination: {
        currentPage: page,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      },
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error browsing market items:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while browsing the marketplace.'
    });
  }
});

/**
 * GET /market/item/:id
 * View a specific marketplace item
 */
router.get('/item/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    
    // Get the item details
    const item = await MarketItem.getById(itemId);
    
    if (!item) {
      return res.status(404).render('error', {
        title: 'Item Not Found - Vivid Market',
        errorCode: 404,
        message: 'The requested item could not be found.'
      });
    }
    
    // Increment view count
    await MarketItem.incrementViews(itemId);
    
    // Get seller's other items (limit to 4)
    const sellerItems = await MarketItem.getByCreator(item.creator.id, 4, [itemId]);
    
    // Check if user can purchase (has enough WIR)
    let canPurchase = false;
    let isInWishlist = false;
    let userCollections = [];
    
    if (req.isAuthenticated()) {
      // Check if user has enough WIR
      canPurchase = req.user.wirBalance >= item.wirPrice;
      
      // Check if item is in user's wishlist
      isInWishlist = await MarketItem.isInWishlist(itemId, req.user.id);
      
      // Get user's collections for the "Add to Collection" dropdown
      userCollections = await Collection.getByUser(req.user.id);
    }
    
    res.render('market/item', {
      title: `${item.title} - Vivid Market`,
      pageDescription: truncateText(item.description, 160),
      item,
      sellerItems,
      canPurchase,
      isInWishlist,
      userCollections,
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error viewing market item:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while loading the item.'
    });
  }
});

/**
 * POST /market/item/:id/purchase
 * Purchase a marketplace item
 */
router.post('/item/:id/purchase', ensureAuthenticated, async (req, res) => {
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
      // Remove from wishlist if it was there
      await MarketItem.removeFromWishlist(itemId, userId);
      
      // Update user's WIR balance in session
      req.user.wirBalance = result.newBalance;
      
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
    console.error('Error purchasing item:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during purchase'
    });
  }
});

/**
 * GET /market/collections
 * Browse collections
 */
router.get('/collections', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // Collections per page
    const offset = (page - 1) * limit;
    
    // Extract filter parameters
    const filters = {
      creator: req.query.creator,
      search: req.query.search,
      sort: req.query.sort || 'newest'
    };
    
    // Get collections with filters
    const { collections, total } = await Collection.getFiltered(filters, limit, offset);
    
    // Get featured collections (limit to 3)
    const featuredCollections = await Collection.getFeatured(3);
    
    // Get top creators for filter dropdown
    const creators = await Collection.getTopCreators(10);
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    
    res.render('market/collections', {
      title: 'Collections - Vivid Market',
      pageDescription: 'Browse curated collections in the Vivid Market',
      collections,
      featuredCollections,
      creators,
      filters,
      pagination: {
        currentPage: page,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      },
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error browsing collections:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while browsing collections.'
    });
  }
});

/**
 * GET /market/collections/:id
 * View a specific collection
 */
router.get('/collections/:id', async (req, res) => {
  try {
    const collectionId = req.params.id;
    
    // Get the collection details
    const collection = await Collection.getById(collectionId);
    
    if (!collection) {
      return res.status(404).render('error', {
        title: 'Collection Not Found - Vivid Market',
        errorCode: 404,
        message: 'The requested collection could not be found.'
      });
    }
    
    // Check if collection is private and not owned by the current user
    if (!collection.isPublic && (!req.isAuthenticated() || req.user.id !== collection.creator.id)) {
      return res.status(403).render('error', {
        title: 'Access Denied - Vivid Market',
        errorCode: 403,
        message: 'This collection is private.'
      });
    }
    
    // Increment view count
    await Collection.incrementViews(collectionId);
    
    // Check if user is the owner
    const isOwner = req.isAuthenticated() && req.user.id === collection.creator.id;
    
    // Check if user is following the collection
    let isFollowing = false;
    if (req.isAuthenticated()) {
      isFollowing = await Collection.isFollowing(collectionId, req.user.id);
    }
    
    // If user is the owner, get their items for the "Add Items" modal
    let userItems = [];
    let purchasedItems = [];
    let wishlistItems = [];
    
    if (isOwner) {
      userItems = await MarketItem.getByCreator(req.user.id, 100);
      purchasedItems = await MarketItem.getPurchasedByUser(req.user.id);
      wishlistItems = await MarketItem.getWishlistByUser(req.user.id);
    }
    
    // Get base URL for sharing
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.render('market/collection', {
      title: `${collection.name} - Vivid Market`,
      pageDescription: truncateText(collection.description, 160) || `A collection by ${collection.creator.displayName}`,
      collection,
      isOwner,
      isFollowing,
      userItems,
      purchasedItems,
      wishlistItems,
      baseUrl,
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error viewing collection:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while loading the collection.'
    });
  }
});

/**
 * POST /market/collections/:id/follow
 * Follow a collection
 */
router.post('/collections/:id/follow', ensureAuthenticated, async (req, res) => {
  try {
    const collectionId = req.params.id;
    const userId = req.user.id;
    
    // Check if collection exists
    const collection = await Collection.getById(collectionId);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    // Follow the collection
    await Collection.follow(collectionId, userId);
    
    res.json({
      success: true,
      message: 'Collection followed successfully'
    });
  } catch (error) {
    console.error('Error following collection:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while following the collection'
    });
  }
});

/**
 * DELETE /market/collections/:id/follow
 * Unfollow a collection
 */
router.delete('/collections/:id/follow', ensureAuthenticated, async (req, res) => {
  try {
    const collectionId = req.params.id;
    const userId = req.user.id;
    
    // Unfollow the collection
    await Collection.unfollow(collectionId, userId);
    
    res.json({
      success: true,
      message: 'Collection unfollowed successfully'
    });
  } catch (error) {
    console.error('Error unfollowing collection:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while unfollowing the collection'
    });
  }
});

/**
 * GET /market/collections/:id/embed
 * Embedded view of a collection
 */
router.get('/collections/:id/embed', async (req, res) => {
  try {
    const collectionId = req.params.id;
    
    // Get the collection details
    const collection = await Collection.getById(collectionId);
    
    if (!collection || !collection.isPublic) {
      return res.status(404).render('error', {
        title: 'Collection Not Found',
        errorCode: 404,
        message: 'The requested collection could not be found or is private.',
        layout: 'embed' // Use a minimal layout for embeds
      });
    }
    
    res.render('market/embed-collection', {
      title: `${collection.name} - Vivid Market`,
      collection,
      layout: 'embed', // Use a minimal layout for embeds
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error rendering embedded collection:', error);
    res.status(500).render('error', {
      title: 'Error',
      errorCode: 500,
      message: 'An error occurred while loading the embedded collection.',
      layout: 'embed'
    });
  }
});

/**
 * GET /market/submit
 * Render the item submission form
 */
router.get('/submit', ensureAuthenticated, async (req, res) => {
  try {
    // Get categories for dropdown
    const categories = await MarketItem.getCategories();
    
    // Format categories for the dropdown
    const formattedCategories = categories.map(category => ({
      value: category,
      label: category.charAt(0).toUpperCase() + category.slice(1)
    }));
    
    // Get user's collections for the dropdown
    const userCollections = await Collection.getByUser(req.user.id);
    
    res.render('market/submit', {
      title: 'Submit Item - Vivid Market',
      pageDescription: 'Submit a new item to the Vivid Market',
      categories: formattedCategories,
      user: {
        ...req.user,
        collections: userCollections
      },
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error rendering submit form:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while loading the submission form.'
    });
  }
});

/**
 * POST /market/submit
 * Submit a new item to the marketplace
 */
router.post('/submit', ensureAuthenticated, async (req, res) => {
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
      collectionId
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
      creatorId: userId
    });
    
    if (result.success) {
      // Update user's WIR balance in session
      req.user.wirBalance = result.newBalance;
      
      // If a collection ID was provided, add the item to that collection
      if (collectionId) {
        await Collection.addItem(collectionId, result.itemId);
      }
      
      return res.json({
        success: true,
        message: 'Item submitted successfully',
        itemId: result.itemId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to submit item'
      });
    }
  } catch (error) {
    console.error('Error submitting item:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting the item'
    });
  }
});

/**
 * POST /market/wir/convert
 * Convert between WIR and Loot tokens
 */
router.post('/wir/convert', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { direction, amount } = req.body;
    
    // Validate input
    if (!direction || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversion parameters'
      });
    }
    
    // Process conversion
    const result = await WIRTransaction.convert(userId, direction, parseInt(amount));
    
    if (result.success) {
      // Update user's balances in session
      req.user.wirBalance = result.newWirBalance;
      req.user.lootTokens = result.newLootBalance;
      
      return res.json({
        success: true,
        message: 'Conversion successful',
        newWirBalance: result.newWirBalance,
        newLootBalance: result.newLootBalance
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Conversion failed'
      });
    }
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during conversion'
    });
  }
});

module.exports = router;