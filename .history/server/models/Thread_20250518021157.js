/**
 * Thread Model
 * Handles forum thread operations
 */

const { supabase } = require('../utils/database');
const { cache } = require('../utils/performance');

class Thread {
  /**
   * Create a new forum thread
   * @param {Object} threadData - Thread data
   * @returns {Promise<Object>} Result object with success status and thread ID
   */
  static async create(threadData) {
    try {
      const {
        title,
        content,
        category,
        creatorId,
        tags = []
      } = threadData;

      // Insert the thread
      const { data: thread, error: threadError } = await supabase
        .from('forum_threads')
        .insert({
          title,
          content,
          category,
          creator_id: creatorId,
          tags: Array.isArray(tags) ? tags : [],
          views: 0,
          is_pinned: false,
          is_locked: false
        })
        .select('id')
        .single();

      if (threadError) throw threadError;

      // Clear cache since we've added a new thread
      this.clearCategoryCache(category);
      this.clearRecentThreadsCache();

      return {
        success: true,
        threadId: thread.id
      };
    } catch (error) {
      console.error('Error creating thread:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a thread by ID
   * @param {string} id - Thread ID
   * @returns {Promise<Object|null>} Thread object or null if not found
   */
  static async getById(id) {
    try {
      // Check cache first
      const cacheKey = `thread:${id}`;
      const cachedThread = cache.get(cacheKey);

      if (cachedThread) {
        return cachedThread;
      }

      // Get thread from database
      const { data: thread, error } = await supabase
        .from('forum_threads')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar,
            custom_glyph
          ),
          replies:forum_replies (
            id,
            content,
            created_at,
            updated_at,
            creator:creator_id (
              id,
              username,
              display_name,
              avatar,
              custom_glyph
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!thread) return null;

      // Format the thread data
      const formattedThread = this.formatThread(thread);

      // Cache the result
      cache.set(cacheKey, formattedThread, 300); // Cache for 5 minutes

      return formattedThread;
    } catch (error) {
      console.error('Error getting thread by ID:', error);
      return null;
    }
  }

  /**
   * Get threads by category
   * @param {string} category - Category name
   * @param {number} limit - Maximum number of threads to return
   * @param {number} offset - Number of threads to skip
   * @returns {Promise<Object>} Object with threads array and total count
   */
  static async getByCategory(category, limit = 20, offset = 0) {
    try {
      // Check cache first
      const cacheKey = `threads:category:${category}:${limit}:${offset}`;
      const cachedThreads = cache.get(cacheKey);

      if (cachedThreads) {
        return cachedThreads;
      }

      // Get threads from database
      const { data: threads, error, count } = await supabase
        .from('forum_threads')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar,
            custom_glyph
          ),
          replies:forum_replies (id)
        `, { count: 'exact' })
        .eq('category', category)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Format the threads data
      const formattedThreads = threads.map(thread => ({
        ...this.formatThread(thread),
        replyCount: thread.replies ? thread.replies.length : 0
      }));

      const result = {
        threads: formattedThreads,
        total: count || 0
      };

      // Cache the result
      cache.set(cacheKey, result, 300); // Cache for 5 minutes

      return result;
    } catch (error) {
      console.error('Error getting threads by category:', error);
      return { threads: [], total: 0 };
    }
  }

  /**
   * Get recent threads
   * @param {number} limit - Maximum number of threads to return
   * @returns {Promise<Array>} Array of thread objects
   */
  static async getRecent(limit = 10) {
    try {
      // Check cache first
      const cacheKey = `threads:recent:${limit}`;
      const cachedThreads = cache.get(cacheKey);

      if (cachedThreads) {
        return cachedThreads;
      }

      // Get threads from database
      const { data: threads, error } = await supabase
        .from('forum_threads')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar,
            custom_glyph
          ),
          replies:forum_replies (id)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Format the threads data
      const formattedThreads = threads.map(thread => ({
        ...this.formatThread(thread),
        replyCount: thread.replies ? thread.replies.length : 0
      }));

      // Cache the result
      cache.set(cacheKey, formattedThreads, 300); // Cache for 5 minutes

      return formattedThreads;
    } catch (error) {
      console.error('Error getting recent threads:', error);
      return [];
    }
  }

  /**
   * Add a reply to a thread
   * @param {string} threadId - Thread ID
   * @param {string} content - Reply content
   * @param {string} creatorId - Creator ID
   * @returns {Promise<Object>} Result object with success status
   */
  static async addReply(threadId, content, creatorId) {
    try {
      // Insert the reply
      const { error: replyError } = await supabase
        .from('forum_replies')
        .insert({
          thread_id: threadId,
          content,
          creator_id: creatorId
        });

      if (replyError) throw replyError;

      // Update thread's updated_at timestamp
      const { error: updateError } = await supabase
        .from('forum_threads')
        .update({
          updated_at: new Date()
        })
        .eq('id', threadId);

      if (updateError) throw updateError;

      // Clear cache
      this.clearThreadCache(threadId);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error adding reply:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format a thread object from database to application format
   * @param {Object} dbThread - Thread object from database
   * @returns {Object} Formatted thread object
   */
  static formatThread(dbThread) {
    return {
      id: dbThread.id,
      title: dbThread.title,
      content: dbThread.content,
      category: dbThread.category,
      tags: dbThread.tags || [],
      views: dbThread.views || 0,
      isPinned: dbThread.is_pinned || false,
      isLocked: dbThread.is_locked || false,
      creator: dbThread.creator ? {
        id: dbThread.creator.id,
        username: dbThread.creator.username,
        displayName: dbThread.creator.display_name,
        avatar: dbThread.creator.avatar,
        customGlyph: dbThread.creator.custom_glyph
      } : null,
      replies: dbThread.replies ? dbThread.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at,
        creator: reply.creator ? {
          id: reply.creator.id,
          username: reply.creator.username,
          displayName: reply.creator.display_name,
          avatar: reply.creator.avatar,
          customGlyph: reply.creator.custom_glyph
        } : null
      })) : [],
      createdAt: dbThread.created_at,
      updatedAt: dbThread.updated_at
    };
  }

  /**
   * Clear thread cache
   * @param {string} threadId - Thread ID
   */
  static clearThreadCache(threadId) {
    cache.del(`thread:${threadId}`);
  }

  /**
   * Clear category cache
   * @param {string} category - Category name
   */
  static clearCategoryCache(category) {
    // Clear all possible cache entries for this category
    for (let i = 0; i <= 100; i += 20) {
      cache.del(`threads:category:${category}:20:${i}`);
    }
  }

  /**
   * Clear recent threads cache
   */
  static clearRecentThreadsCache() {
    for (let i = 5; i <= 20; i += 5) {
      cache.del(`threads:recent:${i}`);
    }
  }

  /**
   * Increment view count for a thread
   * @param {string} id - Thread ID
   * @returns {Promise<boolean>} Success status
   */
  static async incrementViews(id) {
    try {
      // Get current views
      const { data: thread, error: getError } = await supabase
        .from('forum_threads')
        .select('views')
        .eq('id', id)
        .single();

      if (getError) throw getError;
      if (!thread) return false;

      // Increment views
      const { error: updateError } = await supabase
        .from('forum_threads')
        .update({
          views: (thread.views || 0) + 1
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Clear thread cache
      this.clearThreadCache(id);

      return true;
    } catch (error) {
      console.error('Error incrementing thread views:', error);
      return false;
    }
  }
}

module.exports = Thread;
