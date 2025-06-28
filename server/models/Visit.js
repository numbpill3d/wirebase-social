const { supabase, supabaseAdmin } = require('../utils/database');
const { cache } = require('../utils/performance');

/**
 * Site Visit model - records visits and aggregates traffic stats
 */
class Visit {
  /**
   * Record a site visit
   * @param {string} path - Path that was visited
   */
  static async record(path = '/') {
    try {
      await supabaseAdmin
        .from('site_visits')
        .insert({ path });
    } catch (error) {
      console.error('Error recording site visit:', error);
    }
  }

  /**
   * Get hourly visit counts for the last N hours
   * @param {number} hours - Number of hours to include
   * @returns {Array<{hour:number,count:number}>}
   */
  static async getHourlyCounts(hours = 24) {
    try {
      const cacheKey = `visits:hourly:${hours}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
        throw new Error('Invalid hours parameter');
      }

      const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql: `
        SELECT EXTRACT(HOUR FROM visited_at) AS hour,
               COUNT(*)::integer AS count
        FROM site_visits
        WHERE visited_at >= NOW() - INTERVAL '${hours} hours'
        GROUP BY hour
        ORDER BY hour;
      ` });

      if (error) throw error;

      const counts = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
      data.forEach(row => {
        const hour = parseInt(row.hour, 10);
        if (hour >= 0 && hour < 24) {
          counts[hour] = { hour, count: parseInt(row.count, 10) };
        }
      });

      cache.set(cacheKey, counts, 300);
      return counts;
    } catch (error) {
      console.error('Error getting hourly visit counts:', error);
      return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    }
  }
}

module.exports = Visit;
