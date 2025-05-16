const { supabase, supabaseAdmin } = require('../utils/database');

/**
 * Collection model for Supabase
 * Represents a user-created collection of marketplace items
 */
class Collection {
  /**
   * Create a new collection
   * @param {Object} collectionData - Collection data
   * @returns {Promise<Object>} - Created collection object
   */
  static async create(collectionData) {
    try {
      // Convert fields to snake_case for Supabase
      const collection = {
        name: collectionData.name,
        description: collectionData.description,
        creator: collectionData.creator,
        items: collectionData.items || [],
        cover_image: collectionData.coverImage || '/images/defaults/collection-cover.png',
        is_public: collectionData.isPublic !== undefined ? collectionData.isPublic : true
      };

      // Insert collection into Supabase
      const { data, error } = await supabaseAdmin
        .from('collections')
        .insert(collection)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Convert back to camelCase for app use
      return Collection.formatCollection(data);
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Find a collection by its ID
   * @param {string} id - Collection ID
   * @returns {Promise<Object|null>} - Collection object or null
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          creator:creator (
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

      return Collection.formatCollection(data);
    } catch (error) {
      console.error('Error finding collection by ID:', error);
      return null;
    }
  }

  /**
   * Update a collection's information
   * @param {string} id - Collection ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated collection object
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
        .from('collections')
        .update(snakeCaseData)
        .eq('id', id)
        .select(`
          *,
          creator:creator (
            id, username, display_name, avatar, custom_glyph
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return Collection.formatCollection(data);
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  /**
   * Delete a collection by ID
   * @param {string} id - Collection ID
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteById(id) {
    try {
      const { error } = await supabaseAdmin
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      return false;
    }
  }

  /**
   * Add an item to a collection
   * @param {string} collectionId - Collection ID
   * @param {string} itemId - Item ID to add
   * @returns {Promise<Object>} - Updated collection
   */
  static async addItem(collectionId, itemId) {
    try {
      // First get the current collection
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      // Check if item already exists in collection
      if (collection.items.includes(itemId)) {
        return collection; // Item already in collection, no change needed
      }

      // Add the item to the collection
      const updatedItems = [...collection.items, itemId];
      
      return await Collection.findByIdAndUpdate(collectionId, { items: updatedItems });
    } catch (error) {
      console.error('Error adding item to collection:', error);
      throw error;
    }
  }

  /**
   * Remove an item from a collection
   * @param {string} collectionId - Collection ID
   * @param {string} itemId - Item ID to remove
   * @returns {Promise<Object>} - Updated collection
   */
  static async removeItem(collectionId, itemId) {
    try {
      // First get the current collection
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      // Remove the item from the collection
      const updatedItems = collection.items.filter(id => id !== itemId);
      
      return await Collection.findByIdAndUpdate(collectionId, { items: updatedItems });
    } catch (error) {
      console.error('Error removing item from collection:', error);
      throw error;
    }
  }

  /**
   * Find collections by creator
   * @param {string} creatorId - Creator user ID
   * @returns {Promise<Array>} - Array of collections
   */
  static async findByCreator(creatorId) {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          creator:creator (
            id, username, display_name, avatar, custom_glyph
          )
        `)
        .eq('creator', creatorId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(collection => Collection.formatCollection(collection));
    } catch (error) {
      console.error('Error finding collections by creator:', error);
      return [];
    }
  }

  /**
   * Find public collections
   * @param {number} limit - Maximum number of collections to return
   * @returns {Promise<Array>} - Array of public collections
   */
  static async findPublic(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          creator:creator (
            id, username, display_name, avatar, custom_glyph
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data.map(collection => Collection.formatCollection(collection));
    } catch (error) {
      console.error('Error finding public collections:', error);
      return [];
    }
  }

  /**
   * Convert snake_case database fields to camelCase for app use
   * @param {Object} dbCollection - Collection from database
   * @returns {Object} - Formatted collection
   */
  static formatCollection(dbCollection) {
    if (!dbCollection) {
      return null;
    }

    // Extract creator data
    let creator = dbCollection.creator;
    if (creator) {
      // Format creator object if it's from a join
      creator = {
        id: creator.id,
        _id: creator.id,
        username: creator.username,
        displayName: creator.display_name,
        avatar: creator.avatar,
        customGlyph: creator.custom_glyph
      };
    }

    return {
      id: dbCollection.id,
      _id: dbCollection.id, // Legacy ID format for backward compatibility
      name: dbCollection.name,
      description: dbCollection.description,
      creator: creator || dbCollection.creator,
      items: dbCollection.items || [],
      coverImage: dbCollection.cover_image,
      isPublic: dbCollection.is_public,
      createdAt: dbCollection.created_at,
      updatedAt: dbCollection.updated_at
    };
  }
}

module.exports = Collection;