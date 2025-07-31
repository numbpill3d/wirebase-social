/**
 * User Market Routes
 * Routes for user-specific market functionality
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

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

/**
 * GET /market/user/selling
 * User's selling items
 */
router.get('/selling', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get items created by the user
    const items = await MarketItem.getByCreator(userId);

    res.render('market/user/selling', {
      title: 'My Items - Vivid Market',
      pageDescription: 'Manage your items in the Vivid Market',
      items,
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error loading user selling items:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while loading your items.'
    });
  }
});

/**
 * GET /market/user/purchased
 * User's purchased items
 */
router.get('/purchased', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get items purchased by the user
    const items = await MarketItem.getPurchasedByUser(userId);

    res.render('market/user/purchased', {
      title: 'My Purchases - Vivid Market',
      pageDescription: 'View your purchased items in the Vivid Market',
      items,
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error loading user purchased items:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while loading your purchased items.'
    });
  }
});

/**
 * GET /market/user/collections
 * User's collections
 */
router.get('/collections', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get collections created by the user
    const collections = await Collection.getByUser(userId);

    res.render('market/user/collections', {
      title: 'My Collections - Vivid Market',
      pageDescription: 'Manage your collections in the Vivid Market',
      collections,
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error loading user collections:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while loading your collections.'
    });
  }
});

/**
 * GET /market/user/wishlist
 * User's wishlist
 */
router.get('/wishlist', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get items in the user's wishlist
    const items = await MarketItem.getWishlistByUser(userId);

    // Check which items the user can purchase (has enough WIR)
    items.forEach(item => {
      item.canPurchase = req.user.wirBalance >= item.wirPrice;
    });

    res.render('market/user/wishlist', {
      title: 'My Wishlist - Vivid Market',
      pageDescription: 'View your wishlist in the Vivid Market',
      items,
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error loading user wishlist:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while loading your wishlist.'
    });
  }
});

/**
 * GET /market/user/wir
 * User's WIR balance and transactions
 */
router.get('/wir', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's WIR transactions
    const { transactions } = await WIRTransaction.getByUser(userId);

    res.render('market/user/wir', {
      title: 'WIR Balance - Vivid Market',
      pageDescription: 'Manage your WIR balance in the Vivid Market',
      transactions,
      additionalStyles: ['/css/vivid-market.css']
    });
  } catch (error) {
    console.error('Error loading user WIR balance:', error);
    res.status(500).render('error', {
      title: 'Error - Vivid Market',
      errorCode: 500,
      message: 'An error occurred while loading your WIR balance.'
    });
  }
});

/**
 * POST /market/user/wir/transfer
 * Transfer WIR to another user
 */
router.post('/wir/transfer', async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverUsername, amount, notes } = req.body;

    // Validate input
    if (!receiverUsername || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer parameters'
      });
    }

    // Process transfer
    const result = await WIRTransaction.transfer(senderId, receiverUsername, parseInt(amount), notes);

    if (result.success) {
      // Update user's WIR balance in session
      req.user.wirBalance = result.newBalance;

      return res.json({
        success: true,
        message: 'Transfer successful',
        newBalance: result.newBalance
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Transfer failed'
      });
    }
  } catch (error) {
    console.error('Error transferring WIR:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during transfer'
    });
  }
});

/**
 * POST /market/user/wir/convert
 * Convert between WIR and Loot tokens
 */
router.post('/wir/convert', async (req, res) => {
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

/**
 * POST /market/user/wishlist/add/:itemId
 * Add an item to the user's wishlist
 */
router.post('/wishlist/add/:itemId', async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;

    // Check if item exists
    const item = await MarketItem.getById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
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

    // Add to wishlist
    await MarketItem.addToWishlist(itemId, userId);

    res.json({
      success: true,
      message: 'Item added to wishlist'
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding to wishlist'
    });
  }
});

/**
 * DELETE /market/user/wishlist/remove/:itemId
 * Remove an item from the user's wishlist
 */
router.delete('/wishlist/remove/:itemId', async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;

    // Remove from wishlist
    await MarketItem.removeFromWishlist(itemId, userId);

    res.json({
      success: true,
      message: 'Item removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while removing from wishlist'
    });
  }
});

/**
 * POST /market/user/collections/create
 * Create a new collection
 */
router.post('/collections/create', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, coverImage, isPublic } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required'
      });
    }

    // Create the collection
    const result = await Collection.create({
      name,
      description: description || '',
      coverImage: coverImage || '',
      isPublic: isPublic !== false, // Default to public if not specified
      creatorId: userId
    });

    if (result.success) {
      return res.json({
        success: true,
        message: 'Collection created successfully',
        collectionId: result.collectionId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to create collection'
      });
    }
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the collection'
    });
  }
});

/**
 * GET /market/user/collections/:id
 * Get collection data for editing
 */
router.get('/collections/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.id;

    // Get the collection
    const collection = await Collection.getById(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Check if user is the owner
    if (collection.creator.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this collection'
      });
    }

    res.json({
      success: true,
      collection
    });
  } catch (error) {
    console.error('Error getting collection data:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while getting collection data'
    });
  }
});

/**
 * PUT /market/user/collections/:id
 * Update a collection
 */
router.put('/collections/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.id;
    const { name, description, coverImage, isPublic } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required'
      });
    }

    // Check if user is the owner
    const collection = await Collection.getById(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    if (collection.creator.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this collection'
      });
    }

    // Update the collection
    const result = await Collection.update(collectionId, {
      name,
      description: description || '',
      coverImage: coverImage || '',
      isPublic: isPublic !== false // Default to public if not specified
    });

    if (result.success) {
      return res.json({
        success: true,
        message: 'Collection updated successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to update collection'
      });
    }
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the collection'
    });
  }
});

/**
 * DELETE /market/user/collections/:id
 * Delete a collection
 */
router.delete('/collections/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.id;

    // Check if user is the owner
    const collection = await Collection.getById(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    if (collection.creator.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this collection'
      });
    }

    // Delete the collection
    await Collection.delete(collectionId);

    res.json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the collection'
    });
  }
});

/**
 * POST /market/user/collections/:id/add/:itemId
 * Add an item to a collection
 */
router.post('/collections/:id/add/:itemId', async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.id;
    const itemId = req.params.itemId;

    // Check if user is the owner of the collection
    const collection = await Collection.getById(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    if (collection.creator.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this collection'
      });
    }

    // Check if item exists
    const item = await MarketItem.getById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Add item to collection
    await Collection.addItem(collectionId, itemId);

    res.json({
      success: true,
      message: 'Item added to collection'
    });
  } catch (error) {
    console.error('Error adding item to collection:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the item to the collection'
    });
  }
});

/**
 * POST /market/user/collections/:id/add-items
 * Add multiple items to a collection
 */
router.post('/collections/:id/add-items', async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.id;
    const { itemIds } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items specified'
      });
    }

    // Check if user is the owner of the collection
    const collection = await Collection.getById(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    if (collection.creator.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this collection'
      });
    }

    // Add items to collection
    await Collection.addItems(collectionId, itemIds);

    res.json({
      success: true,
      message: `Added ${itemIds.length} items to collection`
    });
  } catch (error) {
    console.error('Error adding items to collection:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding items to the collection'
    });
  }
});

/**
 * DELETE /market/user/collections/:id/remove/:itemId
 * Remove an item from a collection
 */
router.delete('/collections/:id/remove/:itemId', async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.id;
    const itemId = req.params.itemId;

    // Check if user is the owner of the collection
    const collection = await Collection.getById(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    if (collection.creator.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this collection'
      });
    }

    // Remove item from collection
    await Collection.removeItem(collectionId, itemId);

    res.json({
      success: true,
      message: 'Item removed from collection'
    });
  } catch (error) {
    console.error('Error removing item from collection:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while removing the item from the collection'
    });
  }
});

module.exports = router;