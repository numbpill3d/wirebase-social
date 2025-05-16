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
 * User's selling items
 */
router.get('/selling', ensureAuthenticated, async (req, res) => {
  try {
    // Get items the user is selling
    const items = [];
    for (const itemId of req.user.sellingItems || []) {
      const item = await ScrapyardItem.findById(itemId);
      if (item && item.marketplaceStatus === 'available') {
        items.push(item);
      }
    }
    
    res.render('market/user/selling', {
      title: 'My Market Items',
      items,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading selling items:', error);
    res.status(500).render('error', { 
      message: 'Failed to load your selling items',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * User's purchased items
 */
router.get('/purchased', ensureAuthenticated, async (req, res) => {
  try {
    // Get items the user has purchased
    const purchases = await Purchase.findByBuyer(req.user.id);
    
    // Get the actual items
    const items = [];
    for (const purchase of purchases) {
      if (purchase.item) {
        items.push({
          ...purchase.item,
          purchaseDate: purchase.createdAt,
          purchaseId: purchase.id
        });
      }
    }
    
    res.render('market/user/purchased', {
      title: 'My Purchases',
      items,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading purchased items:', error);
    res.status(500).render('error', { 
      message: 'Failed to load your purchased items',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * User's collections
 */
router.get('/collections', ensureAuthenticated, async (req, res) => {
  try {
    // Get user's collections
    const collections = await Collection.findByCreator(req.user.id);
    
    res.render('market/user/collections', {
      title: 'My Collections',
      collections,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading collections:', error);
    res.status(500).render('error', { 
      message: 'Failed to load your collections',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * Create a new collection
 */
router.post('/collections/create', ensureAuthenticated, async (req, res) => {
  try {
    const { name, description, isPublic, coverImage } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required'
      });
    }
    
    // Create the collection
    const collection = await Collection.create({
      name,
      description: description || '',
      creator: req.user.id,
      coverImage: coverImage || null,
      isPublic: isPublic === 'true' || isPublic === true
    });
    
    // Update user's collections
    await User.findByIdAndUpdate(req.user.id, {
      collections: [...req.user.collections, collection.id]
    });
    
    res.json({
      success: true,
      message: 'Collection created successfully',
      collectionId: collection.id
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create collection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Update a collection
 */
router.put('/collections/:id', ensureAuthenticated, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    // Check ownership
    if (collection.creator.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this collection'
      });
    }
    
    const { name, description, isPublic, coverImage } = req.body;
    
    // Update the collection
    const updatedCollection = await Collection.findByIdAndUpdate(req.params.id, {
      name: name || collection.name,
      description: description !== undefined ? description : collection.description,
      isPublic: isPublic !== undefined ? (isPublic === 'true' || isPublic === true) : collection.isPublic,
      coverImage: coverImage || collection.coverImage
    });
    
    res.json({
      success: true,
      message: 'Collection updated successfully',
      collection: updatedCollection
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update collection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Delete a collection
 */
router.delete('/collections/:id', ensureAuthenticated, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    // Check ownership
    if (collection.creator.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this collection'
      });
    }
    
    // Delete the collection
    await Collection.deleteById(req.params.id);
    
    // Update user's collections
    await User.findByIdAndUpdate(req.user.id, {
      collections: req.user.collections.filter(id => id !== req.params.id)
    });
    
    res.json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete collection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Add item to collection
 */
router.post('/collections/:id/add/:itemId', ensureAuthenticated, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    // Check ownership
    if (collection.creator.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this collection'
      });
    }
    
    // Check if item exists
    const item = await ScrapyardItem.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Add item to collection
    const updatedCollection = await Collection.addItem(req.params.id, req.params.itemId);
    
    res.json({
      success: true,
      message: 'Item added to collection',
      collection: updatedCollection
    });
  } catch (error) {
    console.error('Error adding item to collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to collection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Remove item from collection
 */
router.delete('/collections/:id/remove/:itemId', ensureAuthenticated, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    // Check ownership
    if (collection.creator.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this collection'
      });
    }
    
    // Remove item from collection
    const updatedCollection = await Collection.removeItem(req.params.id, req.params.itemId);
    
    res.json({
      success: true,
      message: 'Item removed from collection',
      collection: updatedCollection
    });
  } catch (error) {
    console.error('Error removing item from collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from collection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * User's wishlist
 */
router.get('/wishlist', ensureAuthenticated, async (req, res) => {
  try {
    // Get or create user's wishlist
    const wishlist = await Wishlist.findByUserId(req.user.id);
    
    // Get the actual items
    const items = [];
    for (const itemId of wishlist.items || []) {
      const item = await ScrapyardItem.findById(itemId);
      if (item) {
        items.push(item);
      }
    }
    
    res.render('market/user/wishlist', {
      title: 'My Wishlist',
      items,
      wishlistId: wishlist.id,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading wishlist:', error);
    res.status(500).render('error', { 
      message: 'Failed to load your wishlist',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * Add item to wishlist
 */
router.post('/wishlist/add/:itemId', ensureAuthenticated, async (req, res) => {
  try {
    // Check if item exists
    const item = await ScrapyardItem.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Add item to wishlist
    const wishlist = await Wishlist.addItemToUserWishlist(req.user.id, req.params.itemId);
    
    // Update user's wishlist ID if not already set
    if (!req.user.wishlistId) {
      await User.findByIdAndUpdate(req.user.id, {
        wishlistId: wishlist.id
      });
    }
    
    res.json({
      success: true,
      message: 'Item added to wishlist',
      wishlistId: wishlist.id
    });
  } catch (error) {
    console.error('Error adding item to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * Remove item from wishlist
 */
router.delete('/wishlist/remove/:itemId', ensureAuthenticated, async (req, res) => {
  try {
    // Remove item from wishlist
    const wishlist = await Wishlist.removeItemFromUserWishlist(req.user.id, req.params.itemId);
    
    res.json({
      success: true,
      message: 'Item removed from wishlist',
      wishlistId: wishlist.id
    });
  } catch (error) {
    console.error('Error removing item from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * User's WIR balance and transactions
 */
router.get('/wir', ensureAuthenticated, async (req, res) => {
  try {
    // Get user's transactions
    const transactions = await Transaction.findByUser(req.user.id, {
      limit: 20,
      sort: { created_at: -1 }
    });
    
    res.render('market/user/wir', {
      title: 'My WIR Balance',
      balance: req.user.wirBalance,
      transactions,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading WIR balance:', error);
    res.status(500).render('error', { 
      message: 'Failed to load your WIR balance',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * Transfer WIR to another user
 */
router.post('/wir/transfer', ensureAuthenticated, async (req, res) => {
  try {
    const { receiverUsername, amount, notes } = req.body;
    
    // Validate required fields
    if (!receiverUsername || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Receiver and amount are required'
      });
    }
    
    // Parse amount
    const wirAmount = parseInt(amount);
    if (isNaN(wirAmount) || wirAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    // Check if user has enough balance
    if (req.user.wirBalance < wirAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient WIR balance'
      });
    }
    
    // Find receiver
    const receiver = await User.findOne({ username: receiverUsername });
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }
    
    // Prevent self-transfer
    if (receiver.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer WIR to yourself'
      });
    }
    
    // Create transaction
    const transaction = await Transaction.create({
      senderId: req.user.id,
      receiverId: receiver.id,
      amount: wirAmount,
      transactionType: 'transfer',
      status: 'completed',
      notes: notes || `Transfer to ${receiver.username}`
    });
    
    // Update sender's balance
    await User.findByIdAndUpdate(req.user.id, {
      wirBalance: req.user.wirBalance - wirAmount,
      wirTransactions: [...req.user.wirTransactions, transaction.id]
    });
    
    // Update receiver's balance
    await User.findByIdAndUpdate(receiver.id, {
      wirBalance: receiver.wirBalance + wirAmount,
      wirTransactions: [...receiver.wirTransactions, transaction.id]
    });
    
    res.json({
      success: true,
      message: `Successfully transferred ${wirAmount} WIR to ${receiver.username}`,
      newBalance: req.user.wirBalance - wirAmount,
      transactionId: transaction.id
    });
  } catch (error) {
    console.error('Error transferring WIR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer WIR',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

module.exports = router;