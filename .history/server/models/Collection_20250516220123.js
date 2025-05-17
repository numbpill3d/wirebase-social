/**
 * Collection Model
 * Handles marketplace collection operations
 */

const { supabase } = require('../utils/database');
const { cache } = require('../utils/performance');

class Collection {
  /**
   * Get a collection by ID
   * @param {string} id - The collection ID
   * @returns {Object|null} The collection or null if not found
   */
  static async getById(id) {
    try {
      const { data: collection, error } = await supabase
        .from('market_collections')
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
      if (!collection) return null;

      // Get the items in the collection
      const { data: collectionItems, error: itemsError } = await supabase
        .from('market_collection_items')
        .select(`
          item_id,
          added_at,
          item:item_id (
            *,
            creator:creator_id (
              id,
              username,
              display_name,
              avatar
            )
          )
        `)
        .eq('collection_id', id)
        .order('position');

      if (itemsError) throw itemsError;

      // Format the collection data
      const formattedCollection = this.formatCollection(collection);

      // Add the items to the collection
      formattedCollection.items = collectionItems.map(ci => {
        const formattedItem = {
          ...ci.item,
          addedAt: ci.added_at
        };

        // Format the item
        return {
          id: formattedItem.id,
          title: formattedItem.title,
          description: formattedItem.description,
          category: formattedItem.category,
          categoryName: formattedItem.category.charAt(0).toUpperCase() + formattedItem.category.slice(1),
          wirPrice: formattedItem.wir_price,
          previewImage: formattedItem.preview_image || '/images/market/default-preview.png',
          addedAt: formattedItem.addedAt,
          creator: {
            id: formattedItem.creator.id,
            username: formattedItem.creator.username,
            displayName: formattedItem.creator.display_name,
            avatar: formattedItem.creator.avatar || '/images/default-avatar.png'
          }
        };
      });

      return formattedCollection;
    } catch (error) {
      console.error('Error getting collection by ID:', error);
      return null;
    }
  }

  /**
   * Get collections by user
   * @param {string} userId - The user ID
   * @returns {Array} Array of collections
   */
  static async getByUser(userId) {
    try {
      const { data: collections, error } = await supabase
        .from('market_collections')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get the item counts for each collection
      const collectionIds = collections.map(c => c.id);

      if (collectionIds.length === 0) {
        return [];
      }

      const { data: itemCounts, error: countsError } = await supabase
        .from('market_collection_items')
        .select('collection_id, count')
        .in('collection_id', collectionIds)
        .group('collection_id');

      if (countsError) throw countsError;

      // Create a map of collection ID to item count
      const countMap = {};
      itemCounts.forEach(ic => {
        countMap[ic.collection_id] = parseInt(ic.count);
      });

      // Format the collections and add item counts
      return collections.map(collection => {
        const formattedCollection = this.formatCollection(collection);
        formattedCollection.itemCount = countMap[collection.id] || 0;
        return formattedCollection;
      });
    } catch (error) {
      console.error('Error getting collections by user:', error);
      return [];
    }
  }

  /**
   * Get collections with filters
   * @param {Object} filters - Filter parameters
   * @param {number} limit - Maximum number of collections to return
   * @param {number} offset - Offset for pagination
   * @returns {Object} Object containing collections and total count
   */
  static async getFiltered(filters, limit = 12, offset = 0) {
    try {
      let query = supabase
        .from('market_collections')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `, { count: 'exact' })
        .eq('is_public', true);

      // Apply filters
      if (filters.creator) {
        query = query.eq('creator_id', filters.creator);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      switch (filters.sort) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'popular':
          query = query.order('views', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: collections, error, count } = await query;

      if (error) throw error;

      // Get the item counts for each collection
      const collectionIds = collections.map(c => c.id);

      if (collectionIds.length === 0) {
        return { collections: [], total: 0 };
      }

      const { data: itemCounts, error: countsError } = await supabase
        .from('market_collection_items')
        .select('collection_id, count')
        .in('collection_id', collectionIds)
        .group('collection_id');

      if (countsError) throw countsError;

      // Create a map of collection ID to item count
      const countMap = {};
      itemCounts.forEach(ic => {
        countMap[ic.collection_id] = parseInt(ic.count);
      });

      // Format the collections and add item counts
      const formattedCollections = collections.map(collection => {
        const formattedCollection = this.formatCollection(collection);
        formattedCollection.itemCount = countMap[collection.id] || 0;
        return formattedCollection;
      });

      return {
        collections: formattedCollections,
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting filtered collections:', error);
      return { collections: [], total: 0 };
    }
  }

  /**
   * Get featured collections
   * @param {number} limit - Maximum number of collections to return
   * @returns {Array} Array of collections
   */
  static async getFeatured(limit = 3) {
    try {
      // Check cache first
      const cacheKey = `collection:featured:${limit}`;
      const cachedCollections = cache.get(cacheKey);

      if (cachedCollections) {
        return cachedCollections;
      }

      const { data: collections, error } = await supabase
        .from('market_collections')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `)
        .eq('is_public', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get the item counts for each collection
      const collectionIds = collections.map(c => c.id);

      if (collectionIds.length === 0) {
        return [];
      }

      const { data: itemCounts, error: countsError } = await supabase
        .from('market_collection_items')
        .select('collection_id, count')
        .in('collection_id', collectionIds)
        .group('collection_id');

      if (countsError) throw countsError;

      // Create a map of collection ID to item count
      const countMap = {};
      itemCounts.forEach(ic => {
        countMap[ic.collection_id] = parseInt(ic.count);
      });

      // Format the collections and add item counts
      const formattedCollections = collections.map(collection => {
        const formattedCollection = this.formatCollection(collection);
        formattedCollection.itemCount = countMap[collection.id] || 0;
        return formattedCollection;
      });

      // Cache the results for 10 minutes
      cache.set(cacheKey, formattedCollections, 600);

      return formattedCollections;
    } catch (error) {
      console.error('Error getting featured collections:', error);
      return [];
    }
  }

  /**
   * Get popular collections
   * @param {number} limit - Maximum number of collections to return
   * @returns {Array} Array of collections
   */
  static async getPopular(limit = 4) {
    try {
      const { data: collections, error } = await supabase
        .from('market_collections')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar
          )
        `)
        .eq('is_public', true)
        .order('views', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get the item counts for each collection
      const collectionIds = collections.map(c => c.id);

      if (collectionIds.length === 0) {
        return [];
      }

      const { data: itemCounts, error: countsError } = await supabase
        .from('market_collection_items')
        .select('collection_id, count')
        .in('collection_id', collectionIds)
        .group('collection_id');

      if (countsError) throw countsError;

      // Create a map of collection ID to item count
      const countMap = {};
      itemCounts.forEach(ic => {
        countMap[ic.collection_id] = parseInt(ic.count);
      });

      // Format the collections and add item counts
      return collections.map(collection => {
        const formattedCollection = this.formatCollection(collection);
        formattedCollection.itemCount = countMap[collection.id] || 0;
        return formattedCollection;
      });
    } catch (error) {
      console.error('Error getting popular collections:', error);
      return [];
    }
  }

  /**
   * Get top creators with the most collections
   * @param {number} limit - Maximum number of creators to return
   * @returns {Array} Array of creator objects
   */
  static async getTopCreators(limit = 10) {
    try {
      const { data, error } = await supabase.rpc('get_top_collection_creators', {
        creator_limit: limit
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting top collection creators:', error);
      return [];
    }
  }

  /**
   * Get total count of collections
   * @returns {number} Total count
   */
  static async getCount() {
    try {
      const { count, error } = await supabase
        .from('market_collections')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting collection count:', error);
      return 0;
    }
  }

  /**
   * Create a new collection
   * @param {Object} collectionData - The collection data
   * @returns {Object} Result object with success status
   */
  static async create(collectionData) {
    try {
      const {
        name,
        description,
        coverImage,
        isPublic,
        creatorId
      } = collectionData;

      // Insert the collection
      const { data: collection, error: collectionError } = await supabase
        .from('market_collections')
        .insert({
          name,
          description: description || '',
          cover_image: coverImage || '',
          is_public: isPublic !== false, // Default to public if not specified
          creator_id: creatorId
        })
        .select('id')
        .single();

      if (collectionError) throw collectionError;

      return {
        success: true,
        collectionId: collection.id
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      return {
        success: false,
        message: 'An error occurred while creating the collection'
      };
    }
  }

  /**
   * Update a collection
   * @param {string} collectionId - The collection ID
   * @param {Object} collectionData - The updated collection data
   * @returns {Object} Result object with success status
   */
  static async update(collectionId, collectionData) {
    try {
      const {
        name,
        description,
        coverImage,
        isPublic
      } = collectionData;

      // Update the collection
      const { error } = await supabase
        .from('market_collections')
        .update({
          name,
          description: description || '',
          cover_image: coverImage || '',
          is_public: isPublic !== false, // Default to public if not specified
          updated_at: new Date()
        })
        .eq('id', collectionId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating collection:', error);
      return {
        success: false,
        message: 'An error occurred while updating the collection'
      };
    }
  }

  /**
   * Delete a collection
   * @param {string} collectionId - The collection ID
   * @returns {boolean} True if successful
   */
  static async delete(collectionId) {
    try {
      // Delete the collection items first
      const { error: itemsError } = await supabase
        .from('market_collection_items')
        .delete()
        .eq('collection_id', collectionId);

      if (itemsError) throw itemsError;

      // Delete the collection
      const { error } = await supabase
        .from('market_collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      return false;
    }
  }

  /**
   * Add an item to a collection
   * @param {string} collectionId - The collection ID
   * @param {string} itemId - The item ID
   * @returns {boolean} True if successful
   */
  static async addItem(collectionId, itemId) {
    try {
      // Check if the item is already in the collection
      const { data: existingItem, error: checkError } = await supabase
        .from('market_collection_items')
        .select('id')
        .eq('collection_id', collectionId)
        .eq('item_id', itemId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingItem) {
        return true; // Item already in collection
      }

      // Get the current highest position
      const { data: positionData, error: positionError } = await supabase
        .from('market_collection_items')
        .select('position')
        .eq('collection_id', collectionId)
        .order('position', { ascending: false })
        .limit(1);

      if (positionError) throw positionError;

      const position = positionData.length > 0 ? positionData[0].position + 1 : 0;

      // Add the item to the collection
      const { error } = await supabase
        .from('market_collection_items')
        .insert({
          collection_id: collectionId,
          item_id: itemId,
          position
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error adding item to collection:', error);
      return false;
    }
  }

  /**
   * Add multiple items to a collection
   * @param {string} collectionId - The collection ID
   * @param {Array} itemIds - Array of item IDs
   * @returns {boolean} True if successful
   */
  static async addItems(collectionId, itemIds) {
    try {
      // Get existing items in the collection
      const { data: existingItems, error: existingError } = await supabase
        .from('market_collection_items')
        .select('item_id')
        .eq('collection_id', collectionId);

      if (existingError) throw existingError;

      // Filter out items that are already in the collection
      const existingItemIds = existingItems.map(item => item.item_id);
      const newItemIds = itemIds.filter(id => !existingItemIds.includes(id));

      if (newItemIds.length === 0) {
        return true; // No new items to add
      }

      // Get the current highest position
      const { data: positionData, error: positionError } = await supabase
        .from('market_collection_items')
        .select('position')
        .eq('collection_id', collectionId)
        .order('position', { ascending: false })
        .limit(1);

      if (positionError) throw positionError;

      let position = positionData.length > 0 ? positionData[0].position + 1 : 0;

      // Prepare the items to insert
      const itemsToInsert = newItemIds.map(itemId => ({
        collection_id: collectionId,
        item_id: itemId,
        position: position++
      }));

      // Add the items to the collection
      const { error } = await supabase
        .from('market_collection_items')
        .insert(itemsToInsert);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error adding items to collection:', error);
      return false;
    }
  }

  /**
   * Remove an item from a collection
   * @param {string} collectionId - The collection ID
   * @param {string} itemId - The item ID
   * @returns {boolean} True if successful
   */
  static async removeItem(collectionId, itemId) {
    try {
      // Remove the item from the collection
      const { error } = await supabase
        .from('market_collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', itemId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing item from collection:', error);
      return false;
    }
  }

  /**
   * Increment the view count for a collection
   * @param {string} collectionId - The collection ID
   * @returns {boolean} True if successful
   */
  static async incrementViews(collectionId) {
    try {
      const { error } = await supabase.rpc('increment_collection_views', {
        collection_id: collectionId
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error incrementing collection views:', error);
      return false;
    }
  }

  /**
   * Follow a collection
   * @param {string} collectionId - The collection ID
   * @param {string} userId - The user ID
   * @returns {boolean} True if successful
   */
  static async follow(collectionId, userId) {
    try {
      // Check if already following
      const alreadyFollowing = await this.isFollowing(collectionId, userId);
      if (alreadyFollowing) {
        return true;
      }

      // Add the follow
      const { error } = await supabase
        .from('market_collection_follows')
        .insert({
          collection_id: collectionId,
          user_id: userId
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error following collection:', error);
      return false;
    }
  }

  /**
   * Unfollow a collection
   * @param {string} collectionId - The collection ID
   * @param {string} userId - The user ID
   * @returns {boolean} True if successful
   */
  static async unfollow(collectionId, userId) {
    try {
      // Remove the follow
      const { error } = await supabase
        .from('market_collection_follows')
        .delete()
        .eq('collection_id', collectionId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error unfollowing collection:', error);
      return false;
    }
  }

  /**
   * Check if a user is following a collection
   * @param {string} collectionId - The collection ID
   * @param {string} userId - The user ID
   * @returns {boolean} True if following
   */
  static async isFollowing(collectionId, userId) {
    try {
      const { data, error } = await supabase
        .from('market_collection_follows')
        .select('id')
        .eq('collection_id', collectionId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if following collection:', error);
      return false;
    }
  }

  /**
   * Format a collection from the database
   * @param {Object} collection - The raw collection data
   * @returns {Object} Formatted collection
   */
  static formatCollection(collection) {
    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      coverImage: collection.cover_image || '/images/market/default-collection-cover.png',
      isPublic: collection.is_public,
      isFeatured: collection.is_featured,
      views: collection.views,
      createdAt: collection.created_at,
      updatedAt: collection.updated_at,
      items: [], // Will be populated separately
      creator: {
        id: collection.creator.id,
        username: collection.creator.username,
        displayName: collection.creator.display_name,
        avatar: collection.creator.avatar || '/images/default-avatar.png'
      }
    };
  }
}

module.exports = Collection;