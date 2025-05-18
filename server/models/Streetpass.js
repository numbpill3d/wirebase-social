/**
 * Streetpass Model
 * Handles user visit tracking and interactions
 */

const { supabase } = require('../utils/database');
const { cache } = require('../utils/performance');

class Streetpass {
  /**
   * Record a visit to a user's profile
   * @param {string} visitorId - The ID of the visiting user
   * @param {string} profileId - The ID of the profile being visited
   * @param {string} emote - Optional emote to leave (can be null)
   * @returns {Promise<Object>} Result object with success status
   */
  static async recordVisit(visitorId, profileId, emote = null) {
    try {
      // Don't record visits to your own profile
      if (visitorId === profileId) {
        return { success: false, message: 'Cannot record visits to your own profile' };
      }

      // Get the current timestamp
      const timestamp = new Date();

      // Check if this visitor has visited before
      const { data: existingVisit, error: checkError } = await supabase
        .from('streetpass_visits')
        .select('id, emote')
        .eq('visitor_id', visitorId)
        .eq('profile_id', profileId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingVisit) {
        // Update the existing visit with new timestamp and emote if provided
        const updateData = { 
          visited_at: timestamp
        };
        
        if (emote !== null) {
          updateData.emote = emote;
        }
        
        const { error: updateError } = await supabase
          .from('streetpass_visits')
          .update(updateData)
          .eq('id', existingVisit.id);

        if (updateError) throw updateError;

        // Clear cache for this profile's visitors
        this.clearVisitorsCache(profileId);

        return { 
          success: true, 
          message: 'Visit updated', 
          isNewVisit: false,
          emote: emote || existingVisit.emote
        };
      } else {
        // Create a new visit record
        const { error: insertError } = await supabase
          .from('streetpass_visits')
          .insert({
            visitor_id: visitorId,
            profile_id: profileId,
            emote: emote,
            visited_at: timestamp
          });

        if (insertError) throw insertError;

        // Clear cache for this profile's visitors
        this.clearVisitorsCache(profileId);

        return { 
          success: true, 
          message: 'Visit recorded', 
          isNewVisit: true,
          emote: emote
        };
      }
    } catch (error) {
      console.error('Error recording streetpass visit:', error);
      return { success: false, message: 'Failed to record visit', error };
    }
  }

  /**
   * Get recent visitors for a profile
   * @param {string} profileId - The ID of the profile
   * @param {number} limit - Maximum number of visitors to return
   * @returns {Promise<Array>} Array of visitor objects
   */
  static async getVisitors(profileId, limit = 10) {
    try {
      // Check cache first
      const cacheKey = `streetpass:visitors:${profileId}:${limit}`;
      const cachedVisitors = cache.get(cacheKey);

      if (cachedVisitors) {
        return cachedVisitors;
      }

      // Get visitors from database
      const { data: visits, error } = await supabase
        .from('streetpass_visits')
        .select(`
          id,
          emote,
          visited_at,
          visitor:visitor_id (
            id,
            username,
            display_name,
            avatar,
            custom_glyph
          )
        `)
        .eq('profile_id', profileId)
        .order('visited_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Format the visitor data
      const visitors = visits.map(visit => ({
        id: visit.id,
        emote: visit.emote,
        visitedAt: visit.visited_at,
        visitor: {
          id: visit.visitor.id,
          username: visit.visitor.username,
          displayName: visit.visitor.display_name,
          avatar: visit.visitor.avatar,
          customGlyph: visit.visitor.custom_glyph
        }
      }));

      // Cache the results
      cache.set(cacheKey, visitors, 300); // Cache for 5 minutes

      return visitors;
    } catch (error) {
      console.error('Error getting streetpass visitors:', error);
      return [];
    }
  }

  /**
   * Update the emote for a visit
   * @param {string} visitId - The ID of the visit
   * @param {string} emote - The emote to set
   * @returns {Promise<Object>} Result object with success status
   */
  static async updateEmote(visitId, emote) {
    try {
      // Get the visit to identify the profile for cache clearing
      const { data: visit, error: getError } = await supabase
        .from('streetpass_visits')
        .select('profile_id')
        .eq('id', visitId)
        .single();

      if (getError) throw getError;

      // Update the emote
      const { error } = await supabase
        .from('streetpass_visits')
        .update({ emote })
        .eq('id', visitId);

      if (error) throw error;

      // Clear cache for this profile's visitors
      if (visit) {
        this.clearVisitorsCache(visit.profile_id);
      }

      return { success: true, message: 'Emote updated' };
    } catch (error) {
      console.error('Error updating streetpass emote:', error);
      return { success: false, message: 'Failed to update emote', error };
    }
  }

  /**
   * Clear the visitors cache for a profile
   * @param {string} profileId - The profile ID
   */
  static clearVisitorsCache(profileId) {
    // Clear all possible cache entries for this profile
    for (let i = 1; i <= 20; i++) {
      cache.del(`streetpass:visitors:${profileId}:${i}`);
    }
  }
}

module.exports = Streetpass;
