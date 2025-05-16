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
 * Main marketplace view
 */
router.get('/', async (req, res) => {
  try {
    // Get featured items
    const featuredItems = await ScrapyardItem.findFeaturedMarketplaceItems(6);
    
    // Get recent items
    const recentItems = await ScrapyardItem.findMarketplaceItems({ 
      limit: 12,
      sort: 'newest'
    });
    
    // Get popular collections
    const popularCollections = await Collection.findPublic(4);
    
    // Get marketplace stats
    const itemCount = await ScrapyardItem.countDocuments({ marketplace_status: 'available' });
    
    res.render('market/index', {
      title: 'The Vivid Market',
      subtitle: 'a relic exchange, resource vivarium',
      featuredItems,
      recentItems,
      popularCollections,
      stats: {
        itemCount,
        collectionCount: popularCollections.length
      },
      user: req.user
    });
  } catch (error) {
    console.error('Error loading marketplace:', error);
    res.status(500).render('error', { 
      message: 'Failed to load the marketplace',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * Browse marketplace items with filtering
 */
router.get('/browse', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;
    
    // Parse filter options
    const options = {
      limit,
      offset,
      sort: req.query.sort || 'newest'
    };
    
    if (req.query.category) {
      options.category = req.query.category;
    }
    
    if (req.query.minPrice) {
      options.minPrice = parseInt(req.query.minPrice);
    }
    
    if (req.query.maxPrice) {
      options.maxPrice = parseInt(req.query.maxPrice);
    }
    
    if (req.query.search) {
      options.search = req.query.search;
    }
    
    if (req.query.tags) {
      options.tags = req.query.tags.split(',');
    }
    
    // Get items based on filters
    const items = await ScrapyardItem.findMarketplaceItems(options);
    
    // Get total count for pagination
    const totalCount = await ScrapyardItem.countDocuments({
      marketplace_status: 'available',
      ...(options.category ? { category: options.category } : {}),
      ...(options.search ? { $or: [
        { title: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } }
      ]} : {})
    });
    
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get all categories for filter dropdown
    const categories = [
      'widget', 'template', 'icon', 'banner', 'gif',
      'code', 'audio', 'font', 'texture', 'model'
    ];
    
    res.render('market/browse', {
      title: 'Browse Market',
      items,
      filters: {
        category: req.query.category,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        search: req.query.search,
        tags: req.query.tags,
        sort: req.query.sort
      },
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      user: req.user
    });
  } catch (error) {
    console.error('Error browsing marketplace:', error);
    res.status(500).render('error', { 
      message: 'Failed to load marketplace items',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * View specific item
 */
router.get('/item/:id', async (req, res) => {
  try {
    const item = await ScrapyardItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).render('error', { 
        message: 'Item not found',
        error: { status: 404 }
      });
    }
    
    // Record a view
    await ScrapyardItem.recordView(req.params.id);
    
    // Get seller info
    const seller = await User.findById(item.creator.id);
    
    // Get other items from the same seller
    const sellerItems = await ScrapyardItem.findMarketplaceItems({
      limit: 4,
      category: item.category,
      creator: item.creator.id,
      sort: 'newest'
    });
    
    // Check if item is in user's wishlist
    let isInWishlist = false;
    if (req.user) {
      isInWishlist = await Wishlist.isItemInUserWishlist(req.user.id, item.id);
    }
    
    // Get user collections for the "Add to Collection" dropdown
    let userCollections = [];
    if (req.user) {
      userCollections = await Collection.findByCreator(req.user.id);
    }
    
    res.render('market/item', {
      title: item.title,
      item,
      seller,
      sellerItems,
      isInWishlist,
      userCollections,
      canPurchase: req.user && req.user.wirBalance >= item.wirPrice && req.user.id !== item.creator.id,
      user: req.user
    });
  } catch (error) {
    console.error('Error viewing item:', error);
    res.status(500).render('error', { 
      message: 'Failed to load item details',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * Purchase an item
 */
router.post('/item/:id/purchase', ensureAuthenticated, async (req, res) => {
  try {
    const item = await ScrapyardItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    if (item.marketplaceStatus !== 'available') {
      return res.status(400).json({ success: false, message: 'This item is not available for purchase' });
    }
    
    if (item.creator.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own item' });
    }
    
    if (req.user.wirBalance < item.wirPrice) {
      return res.status(400).json({ success: false, message: 'Insufficient WIR balance' });
    }
    
    // Process the purchase
    const result = await Purchase.processPurchase({
      buyerId: req.user.id,
      sellerId: item.creator.id,
      itemId: item.id,
      price: item.wirPrice
    });
    
    // Update user's purchased items
    await User.findByIdAndUpdate(req.user.id, {
      wirBalance: result.newBuyerBalance,
      purchasedItems: [...req.user.purchasedItems, item.id]
    });
    
    // Update seller's selling items
    const seller = await User.findById(item.creator.id);
    await User.findByIdAndUpdate(seller.id, {
      wirBalance: result.newSellerBalance,
      sellingItems: seller.sellingItems.filter(id => id !== item.id)
    });
    
    res.json({ 
      success: true, 
      message: 'Purchase successful',
      newBalance: result.newBuyerBalance,
      purchaseId: result.purchase.id
    });
  } catch (error) {
    console.error('Error purchasing item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process purchase',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * View all public collections
 */
router.get('/collections', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const offset = (page - 1) * limit;
    
    // Get public collections
    const collections = await Collection.findPublic(limit);
    
    // Get total count for pagination
    const totalCount = await Collection.countDocuments({ is_public: true });
    const totalPages = Math.ceil(totalCount / limit);
    
    res.render('market/collections', {
      title: 'Market Collections',
      collections,
      pagination: {
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      user: req.user
    });
  } catch (error) {
    console.error('Error viewing collections:', error);
    res.status(500).render('error', { 
      message: 'Failed to load collections',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * View specific collection
 */
router.get('/collections/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).render('error', { 
        message: 'Collection not found',
        error: { status: 404 }
      });
    }
    
    if (!collection.isPublic && (!req.user || req.user.id !== collection.creator.id)) {
      return res.status(403).render('error', { 
        message: 'This collection is private',
        error: { status: 403 }
      });
    }
    
    // Get items in the collection
    const collectionItems = [];
    for (const itemId of collection.items) {
      const item = await ScrapyardItem.findById(itemId);
      if (item) {
        collectionItems.push(item);
      }
    }
    
    // Get creator info
    const creator = await User.findById(collection.creator.id);
    
    // Get other collections from the same creator
    const creatorCollections = await Collection.findByCreator(collection.creator.id);
    
    res.render('market/collection', {
      title: collection.name,
      collection,
      items: collectionItems,
      creator,
      creatorCollections: creatorCollections.filter(c => c.id !== collection.id && c.isPublic).slice(0, 4),
      isOwner: req.user && req.user.id === collection.creator.id,
      user: req.user
    });
  } catch (error) {
    console.error('Error viewing collection:', error);
    res.status(500).render('error', { 
      message: 'Failed to load collection details',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * Submit a new item to the marketplace
 */
router.get('/submit', ensureAuthenticated, (req, res) => {
  res.render('market/submit', {
    title: 'Submit to Market',
    categories: [
      { value: 'widget', label: 'Abandoned Processes' },
      { value: 'template', label: 'Dead Shells' },
      { value: 'icon', label: 'Data Fragments' },
      { value: 'banner', label: 'Signal Echoes' },
      { value: 'gif', label: 'Visual Artifacts' },
      { value: 'code', label: 'Code Remnants' },
      { value: 'audio', label: 'Sound Fragments' },
      { value: 'font', label: 'Typography Artifacts' },
      { value: 'texture', label: 'Surface Patterns' },
      { value: 'model', label: '3D Constructs' }
    ],
    user: req.user
  });
});

/**
 * Process item submission
 */
router.post('/submit', ensureAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      content,
      previewImage,
      wirPrice,
      tags
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
    
    // Parse tags
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    // Create the item
    const item = await ScrapyardItem.create({
      title,
      description,
      creator: req.user.id,
      category,
      content,
      previewImage,
      wirPrice: price,
      marketplaceStatus: 'available',
      tags: parsedTags
    });
    
    // Update user's selling items
    await User.findByIdAndUpdate(req.user.id, {
      sellingItems: [...req.user.sellingItems, item.id]
    });
    
    // If item is not free, deduct 1 WIR as listing fee
    if (price > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        wirBalance: req.user.wirBalance - 1
      });
      
      // Create transaction record for listing fee
      await Transaction.create({
        senderId: req.user.id,
        receiverId: process.env.SYSTEM_USER_ID || req.user.id, // System user or self if not defined
        amount: 1,
        transactionType: 'listing_fee',
        status: 'completed',
        notes: `Listing fee for item: ${item.title}`
      });
    }
    
    res.json({
      success: true,
      message: 'Item submitted successfully',
      itemId: item.id
    });
  } catch (error) {
    console.error('Error submitting item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

module.exports = router;