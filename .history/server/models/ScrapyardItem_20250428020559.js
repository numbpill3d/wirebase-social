const { supabase, supabaseAdmin } = require('../utils/database');

/**
 * ScrapyardItem model for Supabase
 */
class ScrapyardItem {
  /**
   * Create a new scrapyard item
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} - Created item object
   */
  static async create(itemData) {
    try {
      // Convert fields to snake_case for Supabase
      const item = {
        title: itemData.title,
        description: itemData.description,
        creator: itemData.creator,
        category: itemData.category,
        content: itemData.content,
        preview_image: itemData.previewImage || ScrapyardItem.getDefaultImage(itemData.category),
        upvotes: itemData.votes?.upvotes || [],
        downvotes: itemData.votes?.downvotes || [],
        price: itemData.price || 0,
        tags: itemData.tags || [],
        usage_count: itemData.usageCount || 0,
        downloads: itemData.downloads || 0,
        comments: itemData.comments || [],
        featured: itemData.featured || false
      };
      
      // Insert item into Supabase
      const { data, error } = await supabaseAdmin
        .from('scrapyard_items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to camelCase for app use
      return ScrapyardItem.formatItem(data);
    } catch (error) {
      console.error('Error creating scrapyard item:', error);
      throw error;
    }
  }
  
  /**
   * Find an item by its ID
   * @param {string} id - Item ID
   * @returns {Promise<Object|null>} - Item object or null
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('scrapyard_items')
        .select(`
          *,
          creator:creator (
            id, username, display_name, avatar, custom_glyph
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return ScrapyardItem.formatItem(data);
    } catch (error) {
      console.error('Error finding scrapyard item by ID:', error);
      return null;
    }
  }
  
  /**
   * Find an item with specific criteria
   * @param {Object} query - Query filters
   * @returns {Promise<Object|null>} - Item object or null
   */
  static async findOne(query) {
    try {
      let supabaseQuery = supabase
        .from('scrapyard_items')
        .select(`
          *,
          creator:creator (
            id, username, display_name, avatar, custom_glyph
          )
        `);
      
      // Apply filters based on query object
      Object.entries(query).forEach(([key, value]) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        supabaseQuery = supabaseQuery.eq(snakeKey, value);
      });
      
      const { data, error } = await supabaseQuery.single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }
      
      return ScrapyardItem.formatItem(data);
    } catch (error) {
      console.error('Error finding scrapyard item:', error);
      return null;
    }
  }
  
  /**
   * Update a scrapyard item's information
   * @param {string} id - Item ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated item object
   */
  static async findByIdAndUpdate(id, updateData) {
    try {
      // Convert to snake_case for Supabase
      const snakeCaseData = {};
      
      // Convert camelCase to snake_case
      Object.keys(updateData).forEach(key => {
        if (key === 'votes') {
          snakeCaseData.upvotes = updateData.votes.upvotes || [];
          snakeCaseData.downvotes = updateData.votes.downvotes || [];
        } else {
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          snakeCaseData[snakeKey] = updateData[key];
        }
      });
      
      // Always update the "updated_at" timestamp
      snakeCaseData.updated_at = new Date();
      
      const { data, error } = await supabaseAdmin
        .from('scrapyard_items')
        .update(snakeCaseData)
        .eq('id', id)
        .select(`
          *,
          creator:creator (
            id, username, display_name, avatar, custom_glyph
          )
        `)
        .single();
      
      if (error) throw error;
      
      return ScrapyardItem.formatItem(data);
    } catch (error) {
      console.error('Error updating scrapyard item:', error);
      throw error;
    }
  }
  
  /**
   * Record a usage of this item (increment usage count)
   * @param {string} id - Item ID 
   * @returns {Promise<Object>} - Updated item
   */
  static async recordUsage(id) {
    try {
      const { data, error } = await supabaseAdmin.rpc('increment_usage_count', { item_id: id });
      
      if (error) {
        // If RPC doesn't exist, update directly
        const item = await ScrapyardItem.findById(id);
        if (!item) throw new Error('Item not found');
        
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('scrapyard_items')
          .update({ usage_count: item.usageCount + 1, updated_at: new Date() })
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        return ScrapyardItem.formatItem(updateData);
      }
      
      // If RPC succeeds, refetch the item
      return await ScrapyardItem.findById(id);
    } catch (error) {
      console.error('Error recording usage:', error);
      throw error;
    }
  }
  
  /**
   * Save changes to an existing item
   * @returns {Promise<Object>} - Updated item
   */
  async save() {
    try {
      // Convert item to snake_case for Supabase
      const itemData = {
        title: this.title,
        description: this.description,
        creator: this.creator,
        category: this.category,
        content: this.content,
        preview_image: this.previewImage,
        upvotes: this.votes?.upvotes || [],
        downvotes: this.votes?.downvotes || [],
        price: this.price,
        tags: this.tags,
        usage_count: this.usageCount,
        downloads: this.downloads,
        comments: this.comments,
        featured: this.featured,
        updated_at: new Date()
      };
      
      const { data, error } = await supabaseAdmin
        .from('scrapyard_items')
        .update(itemData)
        .eq('id', this.id)
        .select(`
          *,
          creator:creator (
            id, username, display_name, avatar, custom_glyph
          )
        `)
        .single();
      
      if (error) throw error;
      
      // Update this instance with the returned data
      Object.assign(this, ScrapyardItem.formatItem(data));
      
      return this;
    } catch (error) {
      console.error('Error saving scrapyard item:', error);
      throw error;
    }
  }
  
  /**
   * Delete an item by ID
   * @param {string} id - Item ID
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteById(id) {
    try {
      const { error } = await supabaseAdmin
        .from('scrapyard_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting scrapyard item:', error);
      return false;
    }
  }
  
  /**
   * Find multiple items with filtering, sorting, and pagination
   * @param {Object} query - Query filters
   * @param {Object} options - Sort, skip, limit options
   * @returns {Promise<Array>} - Array of items
   */
  static async find(query = {}, options = {}) {
    try {
      let supabaseQuery = supabase
        .from('scrapyard_items')
        .select(`
          *,
          creator:creator (
            id, username, display_name, avatar, custom_glyph
          )
        `);
      
      // Apply filters
      Object.entries(query).forEach(([key, value]) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        supabaseQuery = supabaseQuery.eq(snakeKey, value);
      });
      
      // Apply sorting
      if (options.sort) {
        Object.entries(options.sort).forEach(([key, direction]) => {
          // Special case for vote score
          if (key === 'voteScore') {
            // We need to do this sorting in memory after fetching
          } else {
            // Convert camelCase to snake_case
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            const order = direction === 1 ? 'asc' : 'desc';
            supabaseQuery = supabaseQuery.order(snakeKey, { ascending: order === 'asc' });
          }
        });
      }
      
      // Apply pagination
      if (options.skip) {
        const from = options.skip;
        const to = options.limit ? options.skip + options.limit - 1 : from + 999; // Default large range if no limit
        supabaseQuery = supabaseQuery.range(from, to);
      } else if (options.limit) {
        supabaseQuery = supabaseQuery.range(0, options.limit - 1);
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) throw error;
      
      let formattedItems = data.map(item => ScrapyardItem.formatItem(item));
      
      // Handle vote score sorting in memory
      if (options.sort && options.sort.voteScore) {
        const direction = options.sort.voteScore;
        formattedItems.sort((a, b) => {
          const scoreA = a.getVoteScore();
          const scoreB = b.getVoteScore();
          return direction === 1 ? scoreA - scoreB : scoreB - scoreA;
        });
      }
      
      return formattedItems;
    } catch (error) {
      console.error('Error finding scrapyard items:', error);
      return [];
    }
  }
  
  /**
   * Count documents that match a query
   * @param {Object} query - Query filters
   * @returns {Promise<number>} - Count of matching documents
   */
  static async countDocuments(query = {}) {
    try {
      let supabaseQuery = supabase.from('scrapyard_items').select('id', { count: 'exact' });
      
      // Apply filters
      Object.entries(query).forEach(([key, value]) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        supabaseQuery = supabaseQuery.eq(snakeKey, value);
      });
      
      const { count, error } = await supabaseQuery;
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error counting scrapyard items:', error);
      return 0;
    }
  }
  
  /**
   * Aggregate items with MongoDB-like pipeline
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<Array>} - Aggregated results
   */
  static async aggregate(pipeline) {
    try {
      // This is a simplified aggregation implementation for Supabase
      // Full MongoDB aggregation support would require more complex logic
      
      // Example implementation for upvote/downvote aggregation
      if (pipeline.some(stage => stage.$addFields?.voteScore)) {
        // Fetch all items and compute vote score in memory
        const { data, error } = await supabase
          .from('scrapyard_items')
          .select('*');
          
        if (error) throw error;
        
        // Process the pipeline stages manually (simplified)
        const result = data.map(item => {
          const upvotes = item.upvotes?.length || 0;
          const downvotes = item.downvotes?.length || 0;
          
          return {
            ...item,
            voteScore: upvotes - downvotes
          };
        });
        
        // Apply sorting if in the pipeline
        const sortStage = pipeline.find(stage => stage.$sort);
        if (sortStage) {
          const sortField = Object.keys(sortStage.$sort)[0];
          const sortDir = sortStage.$sort[sortField];
          
          result.sort((a, b) => {
            if (sortField === 'voteScore') {
              return sortDir === 1 ? a.voteScore - b.voteScore : b.voteScore - a.voteScore;
            } else if (sortField === 'createdAt') {
              return sortDir === 1 
                ? new Date(a.created_at) - new Date(b.created_at)
                : new Date(b.created_at) - new Date(a.created_at);
            }
            return 0;
          });
        }
        
        // Apply limit if in the pipeline
        const limitStage = pipeline.find(stage => stage.$limit);
        if (limitStage) {
          return result.slice(0, limitStage.$limit).map(item => ScrapyardItem.formatItem(item));
        }
        
        return result.map(item => ScrapyardItem.formatItem(item));
      }
      
      console.warn('Unsupported aggregation pipeline for Supabase');
      return [];
    } catch (error) {
      console.error('Error in aggregation:', error);
      return [];
    }
  }
  
  /**
   * Convert snake_case database fields to camelCase for app use
   * @param {Object} dbItem - Item from database
   * @returns {Object} - Formatted item
   */
  static formatItem(dbItem) {
    if (!dbItem) return null;
    
    // Extract creator data
    let creator = dbItem.creator;
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
    
    // Format the comments
    const comments = dbItem.comments || [];
    
    // Create the formatted item
    const formattedItem = {
      id: dbItem.id,
      _id: dbItem.id, // Legacy ID format for backward compatibility
      title: dbItem.title,
      description: dbItem.description,
      creator: creator || dbItem.creator,
      category: dbItem.category,
      content: dbItem.content,
      previewImage: dbItem.preview_image,
      votes: {
        upvotes: dbItem.upvotes || [],
        downvotes: dbItem.downvotes || []
      },
      price: dbItem.price,
      tags: dbItem.tags || [],
      usageCount: dbItem.usage_count,
      downloads: dbItem.downloads,
      comments: comments,
      featured: dbItem.featured,
      createdAt: dbItem.created_at,
      updatedAt: dbItem.updated_at,
      
      // Methods
      getVoteScore: function() {
        return (this.votes.upvotes?.length || 0) - (this.votes.downvotes?.length || 0);
      },
      
      recordUsage: async function() {
        return ScrapyardItem.recordUsage(this.id);
      }
    };
    
    // Add virtual for category name
    Object.defineProperty(formattedItem, 'categoryName', {
      get: function() {
        const categoryMap = {
          'widget': 'Widget Graveyard',
          'template': 'Template Crypt',
          'icon': 'Icon Vault',
          'banner': 'Banner Keep',
          'gif': 'GIF Dungeon'
        };
        
        return categoryMap[this.category] || 'Unknown Category';
      }
    });
    
    return formattedItem;
  }
  
  /**
   * Get default preview image based on category
   * @param {string} category - Item category
   * @returns {string} - Default image path
   */
  static getDefaultImage(category) {
    switch(category) {
      case 'widget':
        return '/images/defaults/widget-preview.png';
      case 'template':
        return '/images/defaults/template-preview.png';
      case 'icon':
        return '/images/defaults/icon-preview.png';
      case 'banner':
        return '/images/defaults/banner-preview.png';
      case 'gif':
        return '/images/defaults/gif-preview.png';
      default:
        return '/images/defaults/default-preview.png';
    }
  }
}

module.exports = ScrapyardItem;