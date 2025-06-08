const { supabase, supabaseAdmin } = require('../utils/database');

/**
 * Transaction model for Supabase
 * Represents a WIR currency transaction between users
 */
class Transaction {
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} - Created transaction object
   */
  static async create(transactionData) {
    try {
      // Convert fields to snake_case for Supabase
      const transaction = {
        sender_id: transactionData.senderId,
        receiver_id: transactionData.receiverId,
        item_id: transactionData.itemId || null,
        amount: transactionData.amount,
        transaction_type: transactionData.transactionType,
        status: transactionData.status || 'pending',
        notes: transactionData.notes || null
      };

      // Insert transaction into Supabase
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Convert back to camelCase for app use
      return Transaction.formatTransaction(data);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Find a transaction by its ID
   * @param {string} id - Transaction ID
   * @returns {Promise<Object|null>} - Transaction object or null
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          sender:sender_id (
            id, username, display_name, avatar, custom_glyph
          ),
          receiver:receiver_id (
            id, username, display_name, avatar, custom_glyph
          ),
          item:item_id (
            id, title, preview_image
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

      return Transaction.formatTransaction(data);
    } catch (error) {
      console.error('Error finding transaction by ID:', error);
      return null;
    }
  }

  /**
   * Update a transaction's status
   * @param {string} id - Transaction ID
   * @param {string} status - New status ('completed', 'failed', 'refunded')
   * @returns {Promise<Object>} - Updated transaction object
   */
  static async updateStatus(id, status) {
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .update({ 
          status, 
          updated_at: new Date() 
        })
        .eq('id', id)
        .select(`
          *,
          sender:sender_id (
            id, username, display_name, avatar, custom_glyph
          ),
          receiver:receiver_id (
            id, username, display_name, avatar, custom_glyph
          ),
          item:item_id (
            id, title, preview_image
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return Transaction.formatTransaction(data);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  /**
   * Find transactions by user (as sender or receiver)
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, type)
   * @returns {Promise<Array>} - Array of transactions
   */
  static async findByUser(userId, options = {}) {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          sender:sender_id (
            id, username, display_name, avatar, custom_glyph
          ),
          receiver:receiver_id (
            id, username, display_name, avatar, custom_glyph
          ),
          item:item_id (
            id, title, preview_image
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      // Filter by transaction type if specified
      if (options.type) {
        query = query.eq('transaction_type', options.type);
      }

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

      return data.map(transaction => Transaction.formatTransaction(transaction));
    } catch (error) {
      console.error('Error finding transactions by user:', error);
      return [];
    }
  }

  /**
   * Process a purchase transaction
   * @param {Object} purchaseData - Purchase data
   * @returns {Promise<Object>} - Transaction and updated balances
   */
  static async processPurchase(purchaseData) {
    try {
      const { buyerId, sellerId, itemId, price } = purchaseData;
      
      // Start a transaction
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, wir_balance')
        .in('id', [buyerId, sellerId]);
      
      if (userError) {
        throw userError;
      }
      
      const buyer = userData.find(u => u.id === buyerId);
      const seller = userData.find(u => u.id === sellerId);
      
      if (!buyer || !seller) {
        throw new Error('Buyer or seller not found');
      }
      
      // Check if buyer has enough balance
      if (buyer.wir_balance < price) {
        throw new Error('Insufficient WIR balance');
      }
      
      // Create the transaction
      const transaction = await Transaction.create({
        senderId: buyerId,
        receiverId: sellerId,
        itemId,
        amount: price,
        transactionType: 'purchase',
        status: 'pending',
        notes: 'Marketplace purchase'
      });
      
      // Update buyer's balance
      const { error: buyerError } = await supabaseAdmin
        .from('users')
        .update({ 
          wir_balance: buyer.wir_balance - price,
          updated_at: new Date()
        })
        .eq('id', buyerId);
      
      if (buyerError) {
        // Rollback by updating transaction status
        await Transaction.updateStatus(transaction.id, 'failed');
        throw buyerError;
      }
      
      // Update seller's balance
      const { error: sellerError } = await supabaseAdmin
        .from('users')
        .update({ 
          wir_balance: seller.wir_balance + price,
          updated_at: new Date()
        })
        .eq('id', sellerId);
      
      if (sellerError) {
        // Rollback by updating transaction status and reverting buyer's balance
        await Transaction.updateStatus(transaction.id, 'failed');
        await supabaseAdmin
          .from('users')
          .update({ 
            wir_balance: buyer.wir_balance,
            updated_at: new Date()
          })
          .eq('id', buyerId);
        
        throw sellerError;
      }
      
      // Update item status
      const { error: itemError } = await supabaseAdmin
        .from('scrapyard_items')
        .update({ 
          marketplace_status: 'sold',
          updated_at: new Date()
        })
        .eq('id', itemId);
      
      if (itemError) {
        // Log the error but don't rollback the transaction
        console.error('Error updating item status:', itemError);
      }
      
      // Complete the transaction
      const completedTransaction = await Transaction.updateStatus(transaction.id, 'completed');
      
      return {
        transaction: completedTransaction,
        newBuyerBalance: buyer.wir_balance - price,
        newSellerBalance: seller.wir_balance + price
      };
    } catch (error) {
      console.error('Error processing purchase:', error);
      throw error;
    }
  }

  /**
   * Convert snake_case database fields to camelCase for app use
   * @param {Object} dbTransaction - Transaction from database
   * @returns {Object} - Formatted transaction
   */
  static formatTransaction(dbTransaction) {
    if (!dbTransaction) {
      return null;
    }

    // Format sender if available
    let sender = null;
    if (dbTransaction.sender) {
      sender = {
        id: dbTransaction.sender.id,
        _id: dbTransaction.sender.id,
        username: dbTransaction.sender.username,
        displayName: dbTransaction.sender.display_name,
        avatar: dbTransaction.sender.avatar,
        customGlyph: dbTransaction.sender.custom_glyph
      };
    }

    // Format receiver if available
    let receiver = null;
    if (dbTransaction.receiver) {
      receiver = {
        id: dbTransaction.receiver.id,
        _id: dbTransaction.receiver.id,
        username: dbTransaction.receiver.username,
        displayName: dbTransaction.receiver.display_name,
        avatar: dbTransaction.receiver.avatar,
        customGlyph: dbTransaction.receiver.custom_glyph
      };
    }

    // Format item if available
    let item = null;
    if (dbTransaction.item) {
      item = {
        id: dbTransaction.item.id,
        _id: dbTransaction.item.id,
        title: dbTransaction.item.title,
        previewImage: dbTransaction.item.preview_image
      };
    }

    return {
      id: dbTransaction.id,
      _id: dbTransaction.id, // Legacy ID format for backward compatibility
      senderId: dbTransaction.sender_id,
      sender: sender,
      receiverId: dbTransaction.receiver_id,
      receiver: receiver,
      itemId: dbTransaction.item_id,
      item: item,
      amount: dbTransaction.amount,
      transactionType: dbTransaction.transaction_type,
      status: dbTransaction.status,
      notes: dbTransaction.notes,
      createdAt: dbTransaction.created_at,
      updatedAt: dbTransaction.updated_at
    };
  }
}

module.exports = Transaction;
