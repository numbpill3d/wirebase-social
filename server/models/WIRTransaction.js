/**
 * WIRTransaction Model
 * Handles WIR currency transactions for the Vivid Market
 */

const { supabase } = require('../utils/database');

class WIRTransaction {
  /**
   * Create a new WIR transaction
   * @param {Object} transactionData - The transaction data
   * @returns {Object} The created transaction
   */
  static async create(transactionData) {
    try {
      const {
        user_id,
        amount,
        transaction_type,
        reference_id,
        notes
      } = transactionData;

      // Insert the transaction
      const { data: transaction, error } = await supabase
        .from('market_wir_transactions')
        .insert({
          user_id,
          amount,
          transaction_type,
          reference_id: reference_id || null,
          notes: notes || null
        })
        .select('id')
        .single();

      if (error) throw error;

      return transaction;
    } catch (error) {
      console.error('Error creating WIR transaction:', error);
      throw error;
    }
  }

  /**
   * Get WIR transactions by user
   * @param {string} userId - The user ID
   * @param {number} limit - Maximum number of transactions to return
   * @param {number} offset - Offset for pagination
   * @returns {Object} Object containing transactions array and total count
   */
  static async getByUser(userId, limit = 50, offset = 0) {
    try {
      const { data: transactions, error, count } = await supabase
        .from('market_wir_transactions')
        .select(`
          *,
          sender:user_id (
            id,
            username,
            display_name,
            avatar
          ),
          receiver:receiver_id (
            id,
            username,
            display_name,
            avatar
          ),
          item:reference_id (
            id,
            title
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Format the transactions
      const formatted = transactions.map(transaction => this.formatTransaction(transaction));

      return {
        transactions: formatted,
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting WIR transactions by user:', error);
      return { transactions: [], total: 0 };
    }
  }

  /**
   * Transfer WIR from one user to another
   * @param {string} senderId - The sender's user ID
   * @param {string} receiverUsername - The receiver's username
   * @param {number} amount - The amount to transfer
   * @param {string} notes - Optional notes for the transaction
   * @returns {Object} Result object with success status
   */
  static async transfer(senderId, receiverUsername, amount, notes) {
    try {
      // Get the sender's current WIR balance
      const { data: sender, error: senderError } = await supabase
        .from('users')
        .select('wir_balance')
        .eq('id', senderId)
        .single();

      if (senderError) throw senderError;

      if (sender.wir_balance < amount) {
        return {
          success: false,
          message: 'Insufficient WIR balance'
        };
      }

      // Get the receiver by username
      const { data: receiver, error: receiverError } = await supabase
        .from('users')
        .select('id, wir_balance')
        .eq('username', receiverUsername)
        .single();

      if (receiverError) {
        return {
          success: false,
          message: 'Recipient not found'
        };
      }

      // Check if sender is trying to send to themselves
      if (senderId === receiver.id) {
        return {
          success: false,
          message: 'Cannot transfer WIR to yourself'
        };
      }

      // Create the sender's transaction
      await this.create({
        user_id: senderId,
        amount: -amount,
        transaction_type: 'transfer',
        reference_id: receiver.id,
        notes: notes || `Transfer to ${receiverUsername}`
      });

      // Get the sender's username for better transaction notes
      const { data: senderData, error: senderDataError } = await supabase
        .from('users')
        .select('username')
        .eq('id', senderId)
        .single();

      if (senderDataError) throw senderDataError;

      // Create the receiver's transaction
      await this.create({
        user_id: receiver.id,
        amount: amount,
        transaction_type: 'transfer',
        reference_id: senderId,
        notes: notes || `Transfer from ${senderData.username}`
      });

      // Update sender's balance
      const newSenderBalance = sender.wir_balance - amount;
      const { error: updateSenderError } = await supabase
        .from('users')
        .update({ wir_balance: newSenderBalance })
        .eq('id', senderId);

      if (updateSenderError) throw updateSenderError;

      // Update receiver's balance
      const newReceiverBalance = receiver.wir_balance + amount;
      const { error: updateReceiverError } = await supabase
        .from('users')
        .update({ wir_balance: newReceiverBalance })
        .eq('id', receiver.id);

      if (updateReceiverError) throw updateReceiverError;

      return {
        success: true,
        newBalance: newSenderBalance
      };
    } catch (error) {
      console.error('Error transferring WIR:', error);
      return {
        success: false,
        message: 'An error occurred during transfer'
      };
    }
  }

  /**
   * Convert between WIR and Loot tokens
   * @param {string} userId - The user ID
   * @param {string} direction - The conversion direction ('lootToWir' or 'wirToLoot')
   * @param {number} amount - The amount to convert
   * @returns {Object} Result object with success status
   */
  static async convert(userId, direction, amount) {
    try {
      // Get the user's current balances
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('wir_balance, loot_tokens')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      let newWirBalance, newLootBalance;

      if (direction === 'lootToWir') {
        // Check if user has enough Loot tokens
        if (user.loot_tokens < amount) {
          return {
            success: false,
            message: 'Insufficient Loot tokens'
          };
        }

        // Convert Loot to WIR
        newLootBalance = user.loot_tokens - amount;
        newWirBalance = user.wir_balance + amount;

        // Create the transaction
        await this.create({
          user_id: userId,
          amount: amount,
          transaction_type: 'loot_to_wir_conversion',
          notes: `Converted ${amount} Loot to WIR`
        });
      } else if (direction === 'wirToLoot') {
        // Check if user has enough WIR
        if (user.wir_balance < amount) {
          return {
            success: false,
            message: 'Insufficient WIR balance'
          };
        }

        // Convert WIR to Loot
        newWirBalance = user.wir_balance - amount;
        newLootBalance = user.loot_tokens + amount;

        // Create the transaction
        await this.create({
          user_id: userId,
          amount: -amount,
          transaction_type: 'wir_to_loot_conversion',
          notes: `Converted ${amount} WIR to Loot`
        });
      } else {
        return {
          success: false,
          message: 'Invalid conversion direction'
        };
      }

      // Update user's balances
      const { error: updateError } = await supabase
        .from('users')
        .update({
          wir_balance: newWirBalance,
          loot_tokens: newLootBalance
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      return {
        success: true,
        newWirBalance,
        newLootBalance
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      return {
        success: false,
        message: 'An error occurred during conversion'
      };
    }
  }

  /**
   * Get total count of WIR transactions
   * @returns {number} Total count
   */
  static async getCount() {
    try {
      const { count, error } = await supabase
        .from('market_wir_transactions')
        .select('id', { count: 'exact', head: true });

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting WIR transaction count:', error);
      return 0;
    }
  }

  /**
   * Get WIR transaction statistics
   * @returns {Object} Transaction statistics
   */
  static async getStats() {
    try {
      const { data, error } = await supabase.rpc('get_wir_transaction_stats');

      if (error) throw error;

      return data || {
        totalTransactions: 0,
        totalWirVolume: 0,
        avgTransactionAmount: 0
      };
    } catch (error) {
      console.error('Error getting WIR transaction stats:', error);
      return {
        totalTransactions: 0,
        totalWirVolume: 0,
        avgTransactionAmount: 0
      };
    }
  }

  /**
   * Format a WIR transaction from the database
   * @param {Object} transaction - The raw transaction data
   * @returns {Object} Formatted transaction
   */
  static formatTransaction(transaction) {
    // Format the sender
    const sender = transaction.sender ? {
      id: transaction.sender.id,
      username: transaction.sender.username,
      displayName: transaction.sender.display_name,
      avatar: transaction.sender.avatar || '/images/laincore/default-avatar.png'
    } : null;

    // Format the receiver
    const receiver = transaction.receiver ? {
      id: transaction.receiver.id,
      username: transaction.receiver.username,
      displayName: transaction.receiver.display_name,
      avatar: transaction.receiver.avatar || '/images/laincore/default-avatar.png'
    } : null;

    // Format the item
    const item = transaction.item ? {
      id: transaction.item.id,
      title: transaction.item.title
    } : null;

    // Determine the sender ID based on transaction type and amount
    // For transfers, if amount is negative, the current user is the sender
    // If amount is positive, the reference_id points to the sender
    const senderId = transaction.amount < 0 ? transaction.user_id :
                    (transaction.transaction_type === 'transfer' ? transaction.reference_id : null);

    // Determine the receiver ID based on transaction type and amount
    // For transfers, if amount is positive, the current user is the receiver
    // If amount is negative, the reference_id points to the receiver
    const receiverId = transaction.amount > 0 ? transaction.user_id :
                      (transaction.transaction_type === 'transfer' ? transaction.reference_id : null);

    return {
      id: transaction.id,
      userId: transaction.user_id,
      senderId: senderId,
      receiverId: receiverId,
      amount: Math.abs(transaction.amount), // Use absolute value for display
      transactionType: transaction.transaction_type,
      referenceId: transaction.reference_id,
      notes: transaction.notes,
      createdAt: transaction.created_at,
      sender,
      receiver,
      item,
      // Add a direction property for easier UI handling
      direction: transaction.amount < 0 ? 'outgoing' : 'incoming'
    };
  }
}

module.exports = WIRTransaction;