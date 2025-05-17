/**
 * MarketItem Model
 * Handles marketplace item operations
 */

const { supabase } = require('../utils/database');
const WIRTransaction = require('./WIRTransaction');
const { cache } = require('../utils/performance');

class MarketItem {
  /**
   * Get a marketplace item by ID
   * @param {string} id - The item ID
   * @returns {Object|null} The item or null if not found
   */
  static async getById(id) {
    try {
      const { data: item, error } = await supabase
        .from('market_items')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!item) return null;

      // Format the item data
      return this.formatItem(item);
    } catch (error) {
      console.error('Error getting market item by ID:', error);
      return null;
    }
  }

  /**
   * Get recent marketplace items
   * @param {number} limit - Maximum number of items to return
   * @returns {Array} Array of items
   */
  static async getRecent(limit = 10) {
    try {
      // Check cache first
      const cacheKey = `market:recent:${limit}`;
      const cachedItems = cache.get(cacheKey);

      if (cachedItems) {
        return cachedItems;
      }

      const { data: items, error } = await supabase
        .from('market_items')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `)
        .eq('marketplace_status', 'available')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Format the items
      const formattedItems = items.map(item => this.formatItem(item));

      // Cache the results for 5 minutes
      cache.set(cacheKey, formattedItems, 300);

      return formattedItems;
    } catch (error) {
      console.error('Error getting recent market items:', error);
      return [];
    }
  }

  /**
   * Get featured marketplace items
   * @param {number} limit - Maximum number of items to return
   * @returns {Array} Array of items
   */
  static async getFeatured(limit = 6) {
    try {
      // Check cache first
      const cacheKey = `market:featured:${limit}`;
      const cachedItems = cache.get(cacheKey);

      if (cachedItems) {
        return cachedItems;
      }

      const { data: items, error } = await supabase
        .from('market_items')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `)
        .eq('marketplace_status', 'available')
        .eq('featured_in_market', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Format the items
      const formattedItems = items.map(item => this.formatItem(item));

      // Cache the results for 10 minutes (featured items change less frequently)
      cache.set(cacheKey, formattedItems, 600);

      return formattedItems;
    } catch (error) {
      console.error('Error getting featured market items:', error);
      return [];
    }
  }

  /**
   * Get marketplace items with filters
   * @param {Object} filters - Filter parameters
   * @param {number} limit - Maximum number of items to return
   * @param {number} offset - Offset for pagination
   * @returns {Object} Object containing items and total count
   */
  static async getFiltered(filters, limit = 24, offset = 0) {
    try {
      let query = supabase
        .from('market_items')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `, { count: 'exact' })
        .eq('marketplace_status', 'available');

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.ilike.%${filters.search}%`);
      }

      if (filters.minPrice !== null && filters.minPrice !== undefined) {
        query = query.gte('wir_price', filters.minPrice);
      }

      if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
        query = query.lte('wir_price', filters.maxPrice);
      }

      if (filters.tags) {
        const tagArray = filters.tags.split(',').map(tag => tag.trim());
        tagArray.forEach(tag => {
          query = query.ilike('tags', `%${tag}%`);
        });
      }

      if (filters.creator) {
        query = query.eq('creator_id', filters.creator);
      }

      // Apply sorting
      switch (filters.sort) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_low':
          query = query.order('wir_price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('wir_price', { ascending: false });
          break;
        case 'popular':
          query = query.order('views', { ascending: false });
          break;
        case 'trending':
          // For trending, we order by a combination of recent views and downloads
          query = query.order('views', { ascending: false })
                       .order('downloads', { ascending: false });
          break;
        case 'recommended':
          // For recommended, we need special handling after fetching the items
          // We'll use the default sort for now
          query = query.order('created_at', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: items, error, count } = await query;

      if (error) throw error;

      // Format the items
      return {
        items: items.map(item => this.formatItem(item)),
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting filtered market items:', error);
      return { items: [], total: 0 };
    }
  }

  /**
   * Get marketplace items by creator
   * @param {string} creatorId - The creator's user ID
   * @param {number} limit - Maximum number of items to return
   * @param {Array} excludeIds - Array of item IDs to exclude
   * @returns {Array} Array of items
   */
  static async getByCreator(creatorId, limit = 100, excludeIds = []) {
    try {
      let query = supabase
        .from('market_items')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: items, error } = await query;

      if (error) throw error;

      // Format the items
      return items.map(item => this.formatItem(item));
    } catch (error) {
      console.error('Error getting market items by creator:', error);
      return [];
    }
  }

  /**
   * Get marketplace items purchased by a user
   * @param {string} userId - The user ID
   * @returns {Array} Array of purchased items
   */
  static async getPurchasedByUser(userId) {
    try {
      const { data: purchases, error: purchasesError } = await supabase
        .from('market_purchases')
        .select('item_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (purchasesError) throw purchasesError;

      if (purchases.length === 0) {
        return [];
      }

      const itemIds = purchases.map(p => p.item_id);

      const { data: items, error: itemsError } = await supabase
        .from('market_items')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `)
        .in('id', itemIds);

      if (itemsError) throw itemsError;

      // Create a map of purchase dates
      const purchaseDates = {};
      purchases.forEach(p => {
        purchaseDates[p.item_id] = p.created_at;
      });

      // Format the items and add purchase date
      return items.map(item => {
        const formattedItem = this.formatItem(item);
        formattedItem.purchaseDate = purchaseDates[item.id];
        return formattedItem;
      });
    } catch (error) {
      console.error('Error getting purchased market items:', error);
      return [];
    }
  }

  /**
   * Get marketplace items in a user's wishlist
   * @param {string} userId - The user ID
   * @returns {Array} Array of wishlist items
   */
  static async getWishlistByUser(userId) {
    try {
      const { data: wishlist, error: wishlistError } = await supabase
        .from('market_wishlist')
        .select('item_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (wishlistError) throw wishlistError;

      if (wishlist.length === 0) {
        return [];
      }

      const itemIds = wishlist.map(w => w.item_id);

      const { data: items, error: itemsError } = await supabase
        .from('market_items')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `)
        .in('id', itemIds);

      if (itemsError) throw itemsError;

      // Create a map of wishlist dates
      const wishlistDates = {};
      wishlist.forEach(w => {
        wishlistDates[w.item_id] = w.created_at;
      });

      // Format the items and add wishlist date
      return items.map(item => {
        const formattedItem = this.formatItem(item);
        formattedItem.addedToWishlistAt = wishlistDates[item.id];
        return formattedItem;
      });
    } catch (error) {
      console.error('Error getting wishlist market items:', error);
      return [];
    }
  }

  /**
   * Check if an item is in a user's wishlist
   * @param {string} itemId - The item ID
   * @param {string} userId - The user ID
   * @returns {boolean} True if the item is in the wishlist
   */
  static async isInWishlist(itemId, userId) {
    try {
      const { data, error } = await supabase
        .from('market_wishlist')
        .select('id')
        .eq('item_id', itemId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if item is in wishlist:', error);
      return false;
    }
  }

  /**
   * Add an item to a user's wishlist
   * @param {string} itemId - The item ID
   * @param {string} userId - The user ID
   * @returns {boolean} True if successful
   */
  static async addToWishlist(itemId, userId) {
    try {
      // Check if already in wishlist
      const alreadyInWishlist = await this.isInWishlist(itemId, userId);
      if (alreadyInWishlist) {
        return true;
      }

      const { error } = await supabase
        .from('market_wishlist')
        .insert({
          item_id: itemId,
          user_id: userId
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
      return false;
    }
  }

  /**
   * Remove an item from a user's wishlist
   * @param {string} itemId - The item ID
   * @param {string} userId - The user ID
   * @returns {boolean} True if successful
   */
  static async removeFromWishlist(itemId, userId) {
    try {
      const { error } = await supabase
        .from('market_wishlist')
        .delete()
        .eq('item_id', itemId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      return false;
    }
  }

  /**
   * Check if a user owns an item
   * @param {string} itemId - The item ID
   * @param {string} userId - The user ID
   * @returns {boolean} True if the user owns the item
   */
  static async userOwnsItem(itemId, userId) {
    try {
      // Check if user is the creator
      const { data: item, error: itemError } = await supabase
        .from('market_items')
        .select('creator_id')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      if (item.creator_id === userId) {
        return true;
      }

      // Check if user has purchased the item
      const { data, error } = await supabase
        .from('market_purchases')
        .select('id')
        .eq('item_id', itemId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if user owns item:', error);
      return false;
    }
  }

  /**
   * Purchase a marketplace item
   * @param {string} itemId - The item ID
   * @param {string} userId - The user ID
   * @returns {Object} Result object with success status
   */
  static async purchase(itemId, userId) {
    try {
      // Get the item
      const item = await this.getById(itemId);

      if (!item) {
        return {
          success: false,
          message: 'Item not found'
        };
      }

      // Check if item is available
      if (item.marketplaceStatus !== 'available') {
        return {
          success: false,
          message: 'Item is not available for purchase'
        };
      }

      // Check if user already owns the item
      const alreadyOwns = await this.userOwnsItem(itemId, userId);
      if (alreadyOwns) {
        return {
          success: false,
          message: 'You already own this item'
        };
      }

      // Start a transaction
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('wir_balance')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (user.wir_balance < item.wirPrice) {
        return {
          success: false,
          message: 'Insufficient WIR balance'
        };
      }

      // Create the purchase record
      const { error: purchaseError } = await supabase
        .from('market_purchases')
        .insert({
          item_id: itemId,
          user_id: userId,
          price_paid: item.wirPrice
        });

      if (purchaseError) throw purchaseError;

      // Create WIR transaction for buyer
      await WIRTransaction.create({
        user_id: userId,
        amount: -item.wirPrice,
        transaction_type: 'purchase',
        reference_id: itemId,
        notes: `Purchased item: ${item.title}`
      });

      // Create WIR transaction for seller
      await WIRTransaction.create({
        user_id: item.creator.id,
        amount: item.wirPrice,
        transaction_type: 'sale',
        reference_id: itemId,
        notes: `Sold item: ${item.title}`
      });

      // Update user's WIR balance
      const newBalance = user.wir_balance - item.wirPrice;

      const { error: updateError } = await supabase
        .from('users')
        .update({ wir_balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Increment download count
      await this.incrementDownloads(itemId);

      // Create a notification for the seller
      try {
        const { data: buyer, error: buyerError } = await supabase
          .from('users')
          .select('username, display_name')
          .eq('id', userId)
          .single();

        if (!buyerError) {
          // Create notification for the seller
          await supabase
            .from('notifications')
            .insert({
              user_id: item.creator.id,
              type: 'item_sold',
              title: 'Item Sold',
              message: `Your item "${item.title}" was purchased by ${buyer.display_name || buyer.username} for ${item.wirPrice} WIR.`,
              reference_id: itemId,
              reference_type: 'market_item',
              is_read: false
            });
        }
      } catch (notificationError) {
        console.error('Error creating seller notification:', notificationError);
        // Don't fail the purchase if notification creation fails
      }

      return {
        success: true,
        newBalance
      };
    } catch (error) {
      console.error('Error purchasing item:', error);
      return {
        success: false,
        message: 'An error occurred during purchase'
      };
    }
  }

  /**
   * Create a new marketplace item
   * @param {Object} itemData - The item data
   * @returns {Object} Result object with success status
   */
  static async create(itemData) {
    try {
      const {
        title,
        description,
        category,
        content,
        wirPrice,
        tags,
        featuredInMarket,
        previewImage,
        creatorId
      } = itemData;

      // Get user's current WIR balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('wir_balance')
        .eq('id', creatorId)
        .single();

      if (userError) throw userError;

      // Calculate fees
      const listingFee = wirPrice > 0 ? 1 : 0;
      const featuredFee = featuredInMarket ? 5 : 0;
      const totalFee = listingFee + featuredFee;

      if (user.wir_balance < totalFee) {
        return {
          success: false,
          message: 'Insufficient WIR balance for listing fees'
        };
      }

      // Insert the item
      const { data: item, error: itemError } = await supabase
        .from('market_items')
        .insert({
          title,
          description,
          category,
          content,
          wir_price: wirPrice,
          tags,
          featured_in_market: featuredInMarket,
          preview_image: previewImage || '',
          creator_id: creatorId,
          marketplace_status: 'available'
        })
        .select('id')
        .single();

      if (itemError) throw itemError;

      // If there are fees, create WIR transactions and update balance
      if (totalFee > 0) {
        // Create WIR transaction for listing fee
        if (listingFee > 0) {
          await WIRTransaction.create({
            user_id: creatorId,
            amount: -listingFee,
            transaction_type: 'listing_fee',
            reference_id: item.id,
            notes: `Listing fee for item: ${title}`
          });
        }

        // Create WIR transaction for featured fee
        if (featuredFee > 0) {
          await WIRTransaction.create({
            user_id: creatorId,
            amount: -featuredFee,
            transaction_type: 'featured_fee',
            reference_id: item.id,
            notes: `Featured fee for item: ${title}`
          });
        }

        // Update user's WIR balance
        const newBalance = user.wir_balance - totalFee;

        const { error: updateError } = await supabase
          .from('users')
          .update({ wir_balance: newBalance })
          .eq('id', creatorId);

        if (updateError) throw updateError;

        return {
          success: true,
          itemId: item.id,
          newBalance
        };
      }

      return {
        success: true,
        itemId: item.id,
        newBalance: user.wir_balance
      };
    } catch (error) {
      console.error('Error creating market item:', error);
      return {
        success: false,
        message: 'An error occurred while creating the item'
      };
    }
  }

  /**
   * Update a marketplace item
   * @param {string} itemId - The item ID
   * @param {Object} itemData - The updated item data
   * @param {number} featuredFee - Fee for featuring the item (if applicable)
   * @returns {Object} Result object with success status
   */
  static async update(itemId, itemData, featuredFee = 0) {
    try {
      const {
        title,
        description,
        category,
        wirPrice,
        tags,
        featuredInMarket,
        previewImage
      } = itemData;

      // Get the item to check creator
      const { data: item, error: itemError } = await supabase
        .from('market_items')
        .select('creator_id')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // If there's a featured fee, handle it
      let newBalance = null;

      if (featuredFee > 0) {
        // Get user's current WIR balance
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('wir_balance')
          .eq('id', item.creator_id)
          .single();

        if (userError) throw userError;

        if (user.wir_balance < featuredFee) {
          return {
            success: false,
            message: 'Insufficient WIR balance for featured fee'
          };
        }

        // Create WIR transaction for featured fee
        await WIRTransaction.create({
          user_id: item.creator_id,
          amount: -featuredFee,
          transaction_type: 'featured_fee',
          reference_id: itemId,
          notes: `Featured fee for item: ${title}`
        });

        // Update user's WIR balance
        newBalance = user.wir_balance - featuredFee;

        const { error: updateError } = await supabase
          .from('users')
          .update({ wir_balance: newBalance })
          .eq('id', item.creator_id);

        if (updateError) throw updateError;
      }

      // Update the item
      const { error: updateError } = await supabase
        .from('market_items')
        .update({
          title,
          description,
          category,
          wir_price: wirPrice,
          tags,
          featured_in_market: featuredInMarket,
          preview_image: previewImage,
          updated_at: new Date()
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      return {
        success: true,
        newBalance
      };
    } catch (error) {
      console.error('Error updating market item:', error);
      return {
        success: false,
        message: 'An error occurred while updating the item'
      };
    }
  }

  /**
   * Delete a marketplace item
   * @param {string} itemId - The item ID
   * @returns {boolean} True if successful
   */
  static async delete(itemId) {
    try {
      // Delete the item
      const { error } = await supabase
        .from('market_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting market item:', error);
      return false;
    }
  }

  /**
   * Increment the view count for an item
   * @param {string} itemId - The item ID
   * @returns {boolean} True if successful
   */
  static async incrementViews(itemId) {
    try {
      const { error } = await supabase.rpc('increment_market_item_views', {
        item_id: itemId
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error incrementing item views:', error);
      return false;
    }
  }

  /**
   * Increment the download count for an item
   * @param {string} itemId - The item ID
   * @returns {boolean} True if successful
   */
  static async incrementDownloads(itemId) {
    try {
      const { error } = await supabase.rpc('increment_market_item_downloads', {
        item_id: itemId
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error incrementing item downloads:', error);
      return false;
    }
  }

  /**
   * Get all marketplace categories
   * @returns {Array} Array of category names
   */
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('market_categories')
        .select('name')
        .order('name');

      if (error) throw error;

      return data.map(category => category.name);
    } catch (error) {
      console.error('Error getting market categories:', error);
      return [];
    }
  }

  /**
   * Get popular tags
   * @param {number} limit - Maximum number of tags to return
   * @returns {Array} Array of tag objects with name and count
   */
  static async getPopularTags(limit = 20) {
    try {
      const { data, error } = await supabase.rpc('get_popular_market_tags', {
        tag_limit: limit
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting popular tags:', error);
      return [];
    }
  }

  /**
   * Get top categories by item count
   * @param {number} limit - Maximum number of categories to return
   * @returns {Array} Array of category objects with name and count
   */
  static async getTopCategories(limit = 5) {
    try {
      const { data, error } = await supabase.rpc('get_top_market_categories', {
        category_limit: limit
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting top categories:', error);
      return [];
    }
  }

  /**
   * Get trending items based on recent views, purchases, and downloads
   * @param {number} limit - Maximum number of items to return
   * @returns {Array} Array of trending items
   */
  static async getTrending(limit = 6) {
    try {
      const { data: items, error } = await supabase
        .from('market_items')
        .select(`
          *,
          creator:creator_id(id, username, display_name, avatar),
          category:category_id(id, name)
        `)
        .eq('marketplace_status', 'available')
        .order('views', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Format the items
      return items.map(item => this.formatItem(item));
    } catch (error) {
      console.error('Error getting trending items:', error);
      return [];
    }
  }

  /**
   * Get recommended items for a user based on their purchase history
   * @param {string} userId - The user ID
   * @param {number} limit - Maximum number of items to return
   * @returns {Array} Array of recommended items
   */
  static async getRecommended(userId, limit = 6) {
    try {
      // Get user's purchased items
      const { data: purchases, error: purchasesError } = await supabase
        .from('market_purchases')
        .select('item_id')
        .eq('user_id', userId);

      if (purchasesError) throw purchasesError;

      // If user has no purchases, return trending items
      if (!purchases || purchases.length === 0) {
        return this.getTrending(limit);
      }

      // Get categories of purchased items
      const purchasedItemIds = purchases.map(p => p.item_id);

      const { data: purchasedItems, error: itemsError } = await supabase
        .from('market_items')
        .select('category_id')
        .in('id', purchasedItemIds);

      if (itemsError) throw itemsError;

      // Get unique category IDs
      const categoryIds = [...new Set(purchasedItems.map(item => item.category_id))];

      // Get recommended items from the same categories
      const { data: recommendedItems, error: recommendedError } = await supabase
        .from('market_items')
        .select(`
          *,
          creator:creator_id(id, username, display_name, avatar),
          category:category_id(id, name)
        `)
        .eq('marketplace_status', 'available')
        .in('category_id', categoryIds)
        .not('id', 'in', purchasedItemIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (recommendedError) throw recommendedError;

      // If not enough recommended items, fill with trending items
      if (recommendedItems.length < limit) {
        const trendingItems = await this.getTrending(limit - recommendedItems.length);

        // Filter out items that are already in recommended items
        const recommendedItemIds = recommendedItems.map(item => item.id);
        const filteredTrendingItems = trendingItems.filter(item => !recommendedItemIds.includes(item.id));

        return [
          ...recommendedItems.map(item => this.formatItem(item)),
          ...filteredTrendingItems
        ];
      }

      return recommendedItems.map(item => this.formatItem(item));
    } catch (error) {
      console.error('Error getting recommended items:', error);
      return [];
    }
  }

  /**
   * Get top creators by item count
   * @param {number} limit - Maximum number of creators to return
   * @returns {Array} Array of creator objects
   */
  static async getTopCreators(limit = 5) {
    try {
      const { data, error } = await supabase.rpc('get_top_market_creators', {
        creator_limit: limit
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting top creators:', error);
      return [];
    }
  }

  /**
   * Get total count of marketplace items
   * @returns {number} Total count
   */
  static async getCount() {
    try {
      const { count, error } = await supabase
        .from('market_items')
        .select('id', { count: 'exact', head: true });

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting market item count:', error);
      return 0;
    }
  }

  /**
   * Get total count of unique creators
   * @returns {number} Total count
   */
  static async getCreatorCount() {
    try {
      const { data, error } = await supabase.rpc('get_market_creator_count');

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('Error getting market creator count:', error);
      return 0;
    }
  }

  /**
   * Format a market item from the database
   * @param {Object} item - The raw item data
   * @returns {Object} Formatted item
   */
  static formatItem(item) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      categoryName: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      content: item.content,
      wirPrice: item.wir_price,
      tags: item.tags ? item.tags.split(',').map(tag => tag.trim()) : [],
      previewImage: item.preview_image || '/images/market/default-preview.png',
      featuredInMarket: item.featured_in_market,
      marketplaceStatus: item.marketplace_status,
      views: item.views,
      downloads: item.downloads,
      getVoteScore: item.upvotes - item.downvotes,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      creator: {
        id: item.creator.id,
        username: item.creator.username,
        displayName: item.creator.display_name,
        avatar: item.creator.avatar || '/images/default-avatar.png'
      }
    };
  }
}

module.exports = MarketItem;