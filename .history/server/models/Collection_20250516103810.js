/**
 * Collection Model
 * Handles marketplace collection operations
 */

const { supabase } = require('../utils/database');

class Collection {
  /**
   * Get a collection by ID
   * @param {string} id - The collection ID
   * @returns {Object|null} The collection or null if not found
   */
  static async getById(id) {
    try {
      // Get the collection
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
      
      // Get the collection items
      const { data: collectionItems, error: itemsError } = await supabase
        .from('market_collection_items')
        .select('item_id, added_at, position')
        .eq('collection_id', id)
        .order('position');
      
      if (itemsError) throw itemsError;
      
      // If there are no items, return the collection with empty items array
      if (collectionItems.length === 0) {
        return this.formatCollection(collection, []);
      }
      
      // Get the items
      const itemIds = collectionItems.map(ci => ci.item_id);
      
      const { data: items, error: itemsDataError } = await supabase
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
      
      if (itemsDataError) throw itemsDataError;
      
      // Create a map of item dates and positions
      const itemDates = {};
      const itemPositions = {};
      collectionItems.forEach(ci => {
        itemDates[ci.item_id] = ci.added_at;
        itemPositions[ci.item_id] = ci.position;
      });
      
      // Format the items and add dates
      const formattedItems = items.map(item => {
        const formattedItem = {
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          categoryName: item.category.charAt(0).toUpperCase() + item.category.slice(1),
          wirPrice: item.wir_price,
          previewImage: item.preview_image || '/images/market/default-preview.png',
          marketplaceStatus: item.marketplace_status,
          addedAt: itemDates[item.id],
          position: itemPositions[item.id],
          creator: {
            id: item.creator.id,
            username: item.creator.username,
            displayName: item.creator.display_name,
            avatar: item.creator.avatar || '/images/default-avatar.png'
          }
        };
        
        return formattedItem;
      });
      
      // Sort items by position
      formattedItems.sort((a, b) => a.position - b.position);
      
      // Format the collection
      return this.formatCollection(collection, formattedItems);
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
          ),
          market_collection_items (
            item_id
          )
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Format the collections
      return collections.map(collection => {
        return {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          coverImage: collection.cover_image || '/images/market/default-collection.png',
          isPublic: collection.is_public,
          views: collection.views,
          createdAt: collection.created_at,
          updatedAt: collection.updated_at,
          creator: {
            id: collection.creator.id,
            username: collection.creator.username,
            displayName: collection.creator.display_name,
            avatar: collection.creator.avatar || '/images/default-avatar.png'
          },
          items: collection.market_collection_items
        };
      });
    } catch (error) {
      console.error('Error getting collections by user:', error);
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
          ),
          market_collection_items (
            item_id
          )
        `)
        .eq('is_public', true)
        .order('views', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Format the collections
      return collections.map(collection => {
        return {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          coverImage: collection.cover_image || '/images/market/default-collection.png',
          isPublic: collection.is_public,
          views: collection.views,
          createdAt: collection.created_at,
          updatedAt: collection.updated_at,
          creator: {
            id: collection.creator.id,
            username: collection.creator.username,
            displayName: collection.creator.display_name,
            avatar: collection.creator.avatar || '/images/default-avatar.png'
          },
          items: collection.market_collection_items
        };
      });
    } catch (error) {
      console.error('Error getting popular collections:', error);
      return [];
    }
  }
  
  /**
   * Get featured collections
   * @param {number} limit - Maximum number of collections to return
   * @returns {Array} Array of collections
   */
  static async getFeatured(limit = 3) {
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
          ),
          market_collection_items (
            item_id
          )
        `)
        .eq('is_public', true)
        .eq('featured_in_market', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Format the collections
      return collections.map(collection => {
        return {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          coverImage: collection.cover_image || '/images/market/default-collection.png',
          isPublic: collection.is_public,
          views: collection.views,
          createdAt: collection.created_at,
          updatedAt: collection.updated_at,
          creator: {
            id: collection.creator.id,
            username: collection.creator.username,
            displayName: collection.creator.display_name,
            avatar: collection.creator.avatar || '/images/default-avatar.png'
          },
          items: collection.market_collection_items
        };
      });
    } catch (error) {
      console.error('Error getting featured collections:', error);
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
          ),
          market_collection_items (
            item_id
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
        case 'items':
          // This is handled after fetching
          query = query.order('created_at', { ascending: false });
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
      
      // Format the collections
      let formattedCollections = collections.map(collection => {
        return {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          coverImage: collection.cover_image || '/images/market/default-collection.png',
          isPublic: collection.is_public,
          views: collection.views,
          createdAt: collection.created_at,
          updatedAt: collection.updated_at,
          creator: {
            id: collection.creator.id,
            username: collection.creator.username,
            displayName: collection.creator.display_name,
            avatar: collection.creator.avatar || '/images/default-avatar.png'
          },
          items: collection.market_collection_items
        };
      });
      
      // Sort by item count if requested
      if (filters.sort === 'items') {
        formattedCollections.sort((a, b) => b.items.length - a.items.length);
      }
      
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
      const { data: collection, error } = await supabase
        .from('market_collections')
        .insert({
          name,
          description,
          cover_image: coverImage,
          is_public: isPublic,
          creator_id: creatorId
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
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
          description,
          cover_image: coverImage,
          is_public: isPublic,
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
      // Check if item is already in collection
      const { data: existing, error: checkError } = await supabase
        .from('market_collection_items')
        .select('id')
        .eq('collection_id', collectionId)
        .eq('item_id', itemId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existing) {
        // Item already in collection
        return true;
      }
      
      // Get the highest position
      const { data: positions, error: posError } = await supabase
        .from('market_collection_items')
        .select('position')
        .eq('collection_id', collectionId)
        .order('position', { ascending: false })
        .limit(1);
      
      if (posError) throw posError;
      
      const nextPosition = positions.length > 0 ? positions[0].position + 1 : 0;
      
      // Add the item
      const { error } = await supabase
        .from('market_collection_items')
        .insert({
          collection_id: collectionId,
          item_id: itemId,
          position: nextPosition
        });
      
      if (error) throw error;
      
      // Update the collection's updated_at timestamp
      await supabase
        .from('market_collections')
        .update({ updated_at: new Date() })
        .eq('id', collectionId);
      
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
      const { data: existing, error: existingError } = await supabase
        .from('market_collection_items')
        .select('item_id')
        .eq('collection_id', collectionId);
      
      if (existingError) throw existingError;
      
      // Filter out items that are already in the collection
      const existingItemIds = existing.map(item => item.item_id);
      const newItemIds = itemIds.filter(id => !existingItemIds.includes(id));
      
      if (newItemIds.length === 0) {
        // All items are already in the collection
