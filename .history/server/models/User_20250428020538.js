const { supabase, supabaseAdmin } = require('../utils/database');
const bcrypt = require('bcrypt');

/**
 * User model for Supabase
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user object
   */
  static async create(userData) {
    try {
      // Hash password if provided
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }
      
      // Convert fields to snake_case for Supabase
      const user = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        display_name: userData.displayName || userData.username,
        profile_html: userData.profileHtml || '<div class="profile-default">Welcome to my Wirebase profile!</div>',
        profile_css: userData.profileCss || '.profile-default { padding: 20px; border: 2px solid #8a2be2; background-color: #2a1a41; color: #ffd700; font-family: "MS Sans Serif", sans-serif; text-align: center; }',
        avatar: userData.avatar || '/images/default-avatar.png',
        custom_glyph: userData.customGlyph || '⚔️',
        status_message: userData.statusMessage || 'Just joined Wirebase',
        status_icon: userData.statusIcon || 'online',
        loot_tokens: userData.lootTokens || 10,
        badges: userData.badges || [],
        followers: userData.followers || [],
        following: userData.following || [],
        streetpass_visitors: userData.streetpassVisitors || [],
        streetpass_enabled: userData.streetpassEnabled !== undefined ? userData.streetpassEnabled : true,
        custom_emotes: userData.customEmotes || [],
        role: userData.role || 'user'
      };
      
      // Insert user into Supabase
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(user)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to camelCase for app use
      return User.formatUser(data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Find a user by their ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User object or null
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return User.formatUser(data);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }
  
  /**
   * Find a user by their ID and return with password for auth
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User object with password or null
   */
  static async findByIdWithPassword(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return User.formatUser(data);
    } catch (error) {
      console.error('Error finding user by ID with password:', error);
      return null;
    }
  }
  
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object or null
   */
  static async findOne(query) {
    try {
      let supabaseQuery = supabase.from('users').select('*');
      
      // Apply filters based on query object
      if (query.email) {
        supabaseQuery = supabaseQuery.eq('email', query.email);
      }
      
      if (query.username) {
        supabaseQuery = supabaseQuery.eq('username', query.username);
      }
      
      if (query._id) {
        supabaseQuery = supabaseQuery.eq('id', query._id);
      }
      
      const { data, error } = await supabaseQuery.single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }
      
      return User.formatUser(data);
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }
  
  /**
   * Find a user by email with password for authentication
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object with password or null
   */
  static async findOneWithPassword(query) {
    try {
      let supabaseQuery = supabaseAdmin.from('users').select('*');
      
      // Apply filters based on query object
      if (query.email) {
        supabaseQuery = supabaseQuery.eq('email', query.email);
      }
      
      if (query.username) {
        supabaseQuery = supabaseQuery.eq('username', query.username);
      }
      
      if (query._id) {
        supabaseQuery = supabaseQuery.eq('id', query._id);
      }
      
      const { data, error } = await supabaseQuery.single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }
      
      return User.formatUser(data);
    } catch (error) {
      console.error('Error finding user with password:', error);
      return null;
    }
  }
  
  /**
   * Update a user's information
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user object
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
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return User.formatUser(data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  /**
   * Save changes to an existing user object
   * @returns {Promise<Object>} - Updated user object
   */
  async save() {
    try {
      // Convert user object to snake_case for Supabase
      const userData = {
        username: this.username,
        email: this.email,
        password: this.password,
        display_name: this.displayName,
        profile_html: this.profileHtml,
        profile_css: this.profileCss,
        avatar: this.avatar,
        custom_glyph: this.customGlyph,
        status_message: this.statusMessage,
        status_icon: this.statusIcon,
        loot_tokens: this.lootTokens,
        badges: this.badges,
        followers: this.followers,
        following: this.following,
        streetpass_visitors: this.streetpassVisitors,
        streetpass_enabled: this.streetpassEnabled,
        custom_emotes: this.customEmotes,
        last_active: new Date(),
        role: this.role
      };
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(userData)
        .eq('id', this.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update this instance with the returned data
      Object.assign(this, User.formatUser(data));
      
      return this;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }
  
  /**
   * Delete a user by ID
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteById(id) {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  /**
   * Find multiple users with filtering, sorting, and pagination
   * @param {Object} query - Query filters
   * @param {Object} options - Sort, skip, limit options
   * @returns {Promise<Array>} - Array of users
   */
  static async find(query = {}, options = {}) {
    try {
      let supabaseQuery = supabase.from('users').select('*');
      
      // Apply filters
      Object.entries(query).forEach(([key, value]) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        supabaseQuery = supabaseQuery.eq(snakeKey, value);
      });
      
      // Apply sorting
      if (options.sort) {
        Object.entries(options.sort).forEach(([key, direction]) => {
          // Convert camelCase to snake_case
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          const order = direction === 1 ? 'asc' : 'desc';
          supabaseQuery = supabaseQuery.order(snakeKey, { ascending: order === 'asc' });
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
      
      return data.map(user => User.formatUser(user));
    } catch (error) {
      console.error('Error finding users:', error);
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
      let supabaseQuery = supabase.from('users').select('id', { count: 'exact' });
      
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
      console.error('Error counting users:', error);
      return 0;
    }
  }
  
  /**
   * Convert snake_case database fields to camelCase for app use
   * @param {Object} dbUser - User from database
   * @returns {Object} - Formatted user
   */
  static formatUser(dbUser) {
    if (!dbUser) return null;
    
    return {
      id: dbUser.id,
      _id: dbUser.id, // Legacy ID format for backward compatibility
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password,
      displayName: dbUser.display_name,
      profileHtml: dbUser.profile_html,
      profileCss: dbUser.profile_css,
      avatar: dbUser.avatar,
      customGlyph: dbUser.custom_glyph,
      statusMessage: dbUser.status_message,
      statusIcon: dbUser.status_icon,
      lootTokens: dbUser.loot_tokens,
      badges: dbUser.badges || [],
      followers: dbUser.followers || [],
      following: dbUser.following || [],
      streetpassVisitors: dbUser.streetpass_visitors || [],
      streetpassEnabled: dbUser.streetpass_enabled,
      customEmotes: dbUser.custom_emotes || [],
      createdAt: dbUser.created_at,
      lastActive: dbUser.last_active,
      role: dbUser.role,
      
      // Methods
      updateActivity: async function() {
        this.lastActive = new Date();
        return this.save();
      }
    };
  }
  
  /**
   * Get a user's profile URL (virtual property)
   */
  static getProfileUrl(username) {
    return `/profile/${username}`;
  }
}

module.exports = User;