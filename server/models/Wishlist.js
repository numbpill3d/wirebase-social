const { supabase, supabaseAdmin } = require('../utils/database');

/**
 * Wishlist model for Supabase
 * Represents a user's wishlist of marketplace items
 */
class Wishlist {
  /**
   * Create a new wishlist
   * @param {Object} wishlistData - Wishlist data
   * @returns {Promise<Object>} - Created wishlist object
   */
  static async create(wishlistData) {
    try {
      // Convert fields to snake_case for Supabase
      const wishlist = {
        user_id: wishlistData.userId,
        items: wishlistData.items || []
      };

      // Insert wishlist into Supabase
      const { data, error } = await supabaseAdmin
        .from('wishlists')
        .insert(wishlist)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Convert back to camelCase for app use
      return Wishlist.formatWishlist(data);
    } catch (error) {
      console.error('Error creating wishlist:', error);
      throw error;
    }
  }

  /**
   * Find a wishlist by its ID
   * @param {string} id - Wishlist ID
   * @returns {Promise<Object|null>} - Wishlist object or null
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          user:user_id (
            id, username, display_name, avatar, custom_glyph
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

      return Wishlist.formatWishlist(data);
    } catch (error) {
      console.error('Error finding wishlist by ID:', error);
      return null;
    }
  }

  /**
   * Find a user's wishlist
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Wishlist object or null
   */
  static async findByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          user:user_id (
            id, username, display_name, avatar, custom_glyph
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No wishlist found, create one
          return await Wishlist.create({ userId, items: [] });
        }
        throw error;
      }
      if (!data) {
        // No wishlist found, create one
        return await Wishlist.create({ userId, items: [] });
      }

      return Wishlist.formatWishlist(data);
    } catch (error) {
      console.error('Error finding wishlist by user ID:', error);
      return null;
    }
  }

  /**
   * Update a wishlist's information
   * @param {string} id - Wishlist ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated wishlist object
   */
  static async findByIdAndUpdate(id, updateData) {
    try {
      // Convert to snake_case for Supabase
      const snakeCaseData = {};

      // Convert camelCase to snake_case
      Object.keys(updateData).forEach(key => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        snakeCaseData[snakeKey] = updateData[key];
      });

      // Always update the "updated_at" timestamp
      snakeCaseData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('wishlists')
        .update(snakeCaseData)
        .eq('id', id)
        .select(`
          *,
          user:user_id (
            id, username, display_name, avatar, custom_glyph
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return Wishlist.formatWishlist(data);
    } catch (error) {
      console.error('Error updating wishlist:', error);
      throw error;
    }
  }

  /**
   * Add an item to a wishlist
   * @param {string} wishlistId - Wishlist ID
   * @param {string} itemId - Item ID to add
   * @returns {Promise<Object>} - Updated wishlist
   */
  static async addItem(wishlistId, itemId) {
    try {
      // First get the current wishlist
      const wishlist = await Wishlist.findById(wishlistId);
      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Check if item already exists in wishlist
      if (wishlist.items.includes(itemId)) {
        return wishlist; // Item already in wishlist, no change needed
      }

      // Add the item to the wishlist
      const updatedItems = [...wishlist.items, itemId];
      
      return await Wishlist.findByIdAndUpdate(wishlistId, { items: updatedItems });
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
      throw error;
    }
  }

  /**
   * Add an item to a user's wishlist
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID to add
   * @returns {Promise<Object>} - Updated wishlist
   */
  static async addItemToUserWishlist(userId, itemId) {
    try {
      // Get or create the user's wishlist
      const wishlist = await Wishlist.findByUserId(userId);
      if (!wishlist) {
        throw new Error('Could not find or create wishlist');
      }

      // Add the item to the wishlist
      return await Wishlist.addItem(wishlist.id, itemId);
    } catch (error) {
      console.error('Error adding item to user wishlist:', error);
      throw error;
    }
  }

  /**
   * Remove an item from a wishlist
   * @param {string} wishlistId - Wishlist ID
   * @param {string} itemId - Item ID to remove
   * @returns {Promise<Object>} - Updated wishlist
   */
  static async removeItem(wishlistId, itemId) {
    try {
      // First get the current wishlist
      const wishlist = await Wishlist.findById(wishlistId);
      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Remove the item from the wishlist
      const updatedItems = wishlist.items.filter(id => id !== itemId);
      
      return await Wishlist.findByIdAndUpdate(wishlistId, { items: updatedItems });
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      throw error;
    }
  }

  /**
   * Remove an item from a user's wishlist
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID to remove
   * @returns {Promise<Object>} - Updated wishlist
   */
  static async removeItemFromUserWishlist(userId, itemId) {
    try {
      // Get the user's wishlist
      const wishlist = await Wishlist.findByUserId(userId);
      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Remove the item from the wishlist
      return await Wishlist.removeItem(wishlist.id, itemId);
    } catch (error) {
      console.error('Error removing item from user wishlist:', error);
      throw error;
    }
  }

  /**
   * Check if an item is in a user's wishlist
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID to check
   * @returns {Promise<boolean>} - True if item is in wishlist
   */
  static async isItemInUserWishlist(userId, itemId) {
    try {
      // Get the user's wishlist
      const wishlist = await Wishlist.findByUserId(userId);
      if (!wishlist) {
        return false;
      }

      // Check if the item is in the wishlist
      return wishlist.items.includes(itemId);
    } catch (error) {
      console.error('Error checking if item is in user wishlist:', error);
      return false;
    }
  }

  /**
   * Convert snake_case database fields to camelCase for app use
   * @param {Object} dbWishlist - Wishlist from database
   * @returns {Object} - Formatted wishlist
   */
  static formatWishlist(dbWishlist) {
    if (!dbWishlist) {
      return null;
    }

    // Extract user data
    let user = dbWishlist.user;
    if (user) {
      // Format user object if it's from a join
      user = {
        id: user.id,
        _id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatar: user.avatar,
        customGlyph: user.custom_glyph
      };
    }

    return {
      id: dbWishlist.id,
      _id: dbWishlist.id, // Legacy ID format for backward compatibility
      userId: dbWishlist.user_id,
      user: user,
      items: dbWishlist.items || [],
      createdAt: dbWishlist.created_at,
      updatedAt: dbWishlist.updated_at
    };
  }
}

module.exports = Wishlist;
