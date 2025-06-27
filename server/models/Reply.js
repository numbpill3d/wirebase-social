/**
 * Reply Model
 * Handles forum reply operations
 */

const { supabase } = require('../utils/database');
const Thread = require('./Thread');

class Reply {
  /**
   * Create a new forum reply
   * @param {Object} replyData - Reply data
   * @returns {Promise<Object>} Result object with success status and reply ID
   */
  static async create(replyData) {
    try {
      const {
        threadId,
        content,
        creatorId
      } = replyData;

      // Insert the reply
      const { data: reply, error: replyError } = await supabase
        .from('forum_replies')
        .insert({
          thread_id: threadId,
          content,
          creator_id: creatorId
        })
        .select('id')
        .single();

      if (replyError) throw replyError;

      // Update thread's updated_at timestamp
      const { error: updateError } = await supabase
        .from('forum_threads')
        .update({
          updated_at: new Date()
        })
        .eq('id', threadId);

      if (updateError) throw updateError;

      // Clear thread cache
      Thread.clearThreadCache(threadId);

      return {
        success: true,
        replyId: reply.id
      };
    } catch (error) {
      console.error('Error creating reply:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a reply by ID
   * @param {string} id - Reply ID
   * @returns {Promise<Object|null>} Reply object or null if not found
   */
  static async getById(id) {
    try {
      const { data: reply, error } = await supabase
        .from('forum_replies')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar,
            custom_glyph
          ),
          thread:thread_id (
            id,
            title
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!reply) return null;

      // Format the reply data
      return this.formatReply(reply);
    } catch (error) {
      console.error('Error getting reply by ID:', error);
      return null;
    }
  }

  /**
   * Update a reply
   * @param {string} id - Reply ID
   * @param {string} content - New content
   * @returns {Promise<Object>} Result object with success status
   */
  static async update(id, content) {
    try {
      // Get the reply to find its thread ID
      const { data: reply, error: getError } = await supabase
        .from('forum_replies')
        .select('thread_id')
        .eq('id', id)
        .single();

      if (getError) throw getError;
      if (!reply) {
        return {
          success: false,
          error: 'Reply not found'
        };
      }

      // Update the reply
      const { error: updateError } = await supabase
        .from('forum_replies')
        .update({
          content,
          updated_at: new Date()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Clear thread cache
      Thread.clearThreadCache(reply.thread_id);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating reply:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a reply
   * @param {string} id - Reply ID
   * @returns {Promise<Object>} Result object with success status
   */
  static async delete(id) {
    try {
      // Get the reply to find its thread ID
      const { data: reply, error: getError } = await supabase
        .from('forum_replies')
        .select('thread_id')
        .eq('id', id)
        .single();

      if (getError) throw getError;
      if (!reply) {
        return {
          success: false,
          error: 'Reply not found'
        };
      }

      // Delete the reply
      const { error: deleteError } = await supabase
        .from('forum_replies')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Clear thread cache
      Thread.clearThreadCache(reply.thread_id);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting reply:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get replies by thread ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<Array>} Array of reply objects
   */
  static async getByThreadId(threadId) {
    try {
      const { data: replies, error } = await supabase
        .from('forum_replies')
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            display_name,
            avatar,
            custom_glyph
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Format the replies data
      return replies.map(reply => this.formatReply(reply));
    } catch (error) {
      console.error('Error getting replies by thread ID:', error);
      return [];
    }
  }

  /**
   * Count replies that match a query
   * @param {Object} query - Query filters
   * @returns {Promise<number>} - Count of matching replies
   */
  static async countDocuments(query = {}) {
    try {
      let supabaseQuery = supabase
        .from('forum_replies')
        .select('id', { count: 'exact' });

      Object.entries(query).forEach(([key, value]) => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        supabaseQuery = supabaseQuery.eq(snakeKey, value);
      });

      const { count, error } = await supabaseQuery;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error counting replies:', error);
      return 0;
    }
  }

  /**
   * Format a reply object from database to application format
   * @param {Object} dbReply - Reply object from database
   * @returns {Object} Formatted reply object
   */
  static formatReply(dbReply) {
    return {
      id: dbReply.id,
      content: dbReply.content,
      threadId: dbReply.thread_id,
      thread: dbReply.thread ? {
        id: dbReply.thread.id,
        title: dbReply.thread.title
      } : null,
      creator: dbReply.creator ? {
        id: dbReply.creator.id,
        username: dbReply.creator.username,
        displayName: dbReply.creator.display_name,
        avatar: dbReply.creator.avatar,
        customGlyph: dbReply.creator.custom_glyph
      } : null,
      createdAt: dbReply.created_at,
      updatedAt: dbReply.updated_at
    };
  }
}

module.exports = Reply;
