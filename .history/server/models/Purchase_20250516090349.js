const { supabase, supabaseAdmin } = require('../utils/database');

/**
 * Purchase model for Supabase
 * Represents a marketplace purchase transaction
 */
class Purchase {
  /**
   * Create a new purchase record
   * @param {Object} purchaseData - Purchase data
   * @returns {Promise<Object>} - Created purchase object
   */
  static async create(purchaseData) {
    try {
      // Convert fields to snake_case for Supabase
      const purchase = {
        buyer_id: purchaseData.buyerId,
        seller_id: purchaseData.sellerId,
        item_id: purchaseData.itemId,
        transaction_id: purchaseData.transactionId,
        price: purchaseData.price,
        status: purchaseData.status || 'completed',
        notes: purchaseData.notes || null
      };

      // Insert purchase into Supabase
      const { data, error } = await supabaseAdmin
        .from('purchases')
        .insert(purchase)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Convert back to camelCase for app use
      return Purchase.formatPurchase(data);
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  }

  /**
   * Find a purchase by its ID
   * @param {string} id - Purchase ID
   * @returns {Promise<Object|null>} - Purchase object or null
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          buyer:buyer_id (
            id, username, display_name, avatar, custom_glyph
          ),
          seller:seller_id (
            id, username, display_name, avatar, custom_glyph
          ),
          item:item_id (
            id, title, description, preview_image, category
          ),
          transaction:transaction_id (
            id, amount, transaction_type, status, created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }
      if (!data) {
        return null;
      }

      return Purchase.formatPurchase(data);
    } catch (error) {
      console.error('Error finding purchase by ID:', error);
      return null;
    }
  }

  /**
   * Update a purchase's status
   * @param {string} id - Purchase ID
   * @param {string} status - New status ('completed', 'disputed', 'refunded')
   * @param {string} notes - Optional notes about the status change
   * @returns {Promise<Object>} - Updated purchase object
   */
  static async updateStatus(id, status, notes = null) {
    try {
      const updateData = { 
        status, 
        updated_at: new Date() 
      };
      
      if (notes) {
        updateData.notes = notes;
      }
      
      const { data, error } = await supabaseAdmin
        .from('purchases')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          buyer:buyer_id (
            id, username, display_name, avatar, custom_glyph
          ),
          seller:seller_id (
            id, username, display_name, avatar, custom_glyph
          ),
          item:item_id (
            id, title, description, preview_image, category
          ),
          transaction:transaction_id (
            id, amount, transaction_type, status, created_at
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return Purchase.formatPurchase(data);
    } catch (error) {
      console.error('Error updating purchase status:', error);
      throw error;
    }
  }

  /**
   * Find purchases by buyer
   * @param {string} buyerId - Buyer user ID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Promise<Array>} - Array of purchases
   */
  static async findByBuyer(buyerId, options = {}) {
    try {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          buyer:buyer_id (
            id, username, display_name, avatar, custom_glyph
          ),
          seller:seller_id (
            id, username, display_name, avatar, custom_glyph
          ),
          item:item_id (
            id, title, description, preview_image, category
          ),
          transaction:transaction_id (
            id, amount, transaction_type, status, created_at
          )
        `)
        .eq('buyer_id', buyerId);

      // Filter by status if specified
      if (options.status) {
        query = query.eq('status', options.status);
      }

      // Apply pagination
      query = query.order('created_at', { ascending: false });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(purchase => Purchase.formatPurchase(purchase));
    } catch (error) {
      console.error('Error finding purchases by buyer:', error);
      return [];
    }
  }

  /**
   * Find purchases by seller
   * @param {string} sellerId - Seller user ID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Promise<Array>} - Array of purchases
   */
  static async findBySeller(sellerId, options = {}) {
    try {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          buyer:buyer_id (
            id, username, display_name, avatar, custom_glyph
          ),
          seller:seller_id (
            id, username, display_name, avatar, custom_glyph
          ),
          item:item_id (
            id, title, description, preview_image, category
          ),
          transaction:transaction_id (
            id, amount, transaction_type, status, created_at
          )
        `)
        .eq('seller_id', sellerId);

      // Filter by status if specified
      if (options.status) {
        query = query.eq('status', options.status);
      }

      // Apply pagination
      query = query.order('created_at', { ascending: false });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(purchase => Purchase.formatPurchase(purchase));
    } catch (error) {
      console.error('Error finding purchases by seller:', error);
      return [];
    }
  }

  /**
   * Process a complete purchase transaction
   * @param {Object} purchaseData - Purchase data
   * @returns {Promise<Object>} - Purchase record and transaction
   */
  static async processPurchase(purchaseData) {
    const { Transaction } = require('./Transaction');
    
    try {
      // First process the transaction
      const result = await Transaction.processPurchase(purchaseData);
      
      // Create the purchase record
      const purchase = await Purchase.create({
        buyerId: purchaseData.buyerId,
        sellerId: purchaseData.sellerId,
        itemId: purchaseData.itemId,
        transactionId: result.transaction.id,
        price: purchaseData.price,
        status: 'completed'
      });
      
      return {
        purchase,
        transaction: result.transaction,
        newBuyerBalance: result.newBuyerBalance,
        newSellerBalance: result.newSellerBalance
      };
    } catch (error) {
      console.error('Error processing complete purchase:', error);
      throw error;
    }
  }

  /**
   * Convert snake_case database fields to camelCase for app use
   * @param {Object} dbPurchase - Purchase from database
   * @returns {Object} - Formatted purchase
   */
  static formatPurchase(dbPurchase) {
    if (!dbPurchase) {
      return null;
    }

    // Format buyer if available
    let buyer = null;
    if (dbPurchase.buyer) {
      buyer = {
        id: dbPurchase.buyer.id,
        _id: dbPurchase.buyer.id,
        username: dbPurchase.buyer.username,
        displayName: dbPurchase.buyer.display_name,
        avatar: dbPurchase.buyer.avatar,
        customGlyph: dbPurchase.buyer.custom_glyph
      };
    }

    // Format seller if available
    let seller = null;
    if (dbPurchase.seller) {
      seller = {
        id: dbPurchase.seller.id,
        _id: dbPurchase.seller.id,
        username: dbPurchase.seller.username,
        displayName: dbPurchase.seller.display_name,
        avatar: dbPurchase.seller.avatar,
        customGlyph: dbPurchase.seller.custom_glyph
      };
    }

    // Format item if available
    let item = null;
    if (dbPurchase.item) {
      item = {
        id: dbPurchase.item.id,
        _id: dbPurchase.item.id,
        title: dbPurchase.item.title,
        description: dbPurchase.item.description,
        previewImage: dbPurchase.item.preview_image,
        category: dbPurchase.item.category
      };
    }

    // Format transaction if available
    let transaction = null;
    if (dbPurchase.transaction) {
      transaction = {
        id: dbPurchase.transaction.id,
        _id: dbPurchase.transaction.id,
        amount: dbPurchase.transaction.amount,
        transactionType: dbPurchase.transaction.transaction_type,
        status: dbPurchase.transaction.status,
        createdAt: dbPurchase.transaction.created_at
      };
    }

    return {
      id: dbPurchase.id,
      _id: dbPurchase.id, // Legacy ID format for backward compatibility
      buyerId: dbPurchase.buyer_id,
      buyer: buyer,
      sellerId: dbPurchase.seller_id,
      seller: seller,
      itemId: dbPurchase.item_id,
      item: item,
      transactionId: dbPurchase.transaction_id,
      transaction: transaction,
      price: dbPurchase.price,
      status: dbPurchase.status,
      notes: dbPurchase.notes,
      createdAt: dbPurchase.created_at,
      updatedAt: dbPurchase.updated_at
    };
  }
}

module.exports = Purchase;