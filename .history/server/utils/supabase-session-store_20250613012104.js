/**
 * Session store implementation for Supabase
 */
module.exports = function session(session) {
  return class SupabaseSessionStore extends session.Store {
    constructor(options = {}) {
      super(options);
      this.supabase = options.supabase;
      this.tableName = options.tableName || 'sessions';
      this.createTable = options.createTable || false;
      this.clearInterval = options.clearInterval || 86400000; // Clear expired sessions daily
      this.reapInterval = options.reapInterval || 43200000; // Reap every 12 hours
      this.reapMaxConcurrent = options.reapMaxConcurrent || 1;
      
      if (this.createTable) {
        this.createSessionsTable();
      }
      
      if (this.clearInterval) {
        this.setReaper();
      }
    }
    
    async createSessionsTable() {
      try {
        const { error } = await this.supabase.query(`
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            sid VARCHAR PRIMARY KEY,
            sess JSON NOT NULL,
            expired TIMESTAMP WITH TIME ZONE NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expired ON ${this.tableName}(expired);
        `);
        
        if (error) throw error;
        console.log(`Created ${this.tableName} table for sessions`);
      } catch (err) {
        console.error('Error creating sessions table:', err);
      }
    }
    
    setReaper() {
      if (this.reaperTimer) clearInterval(this.reaperTimer);
      this.reaperTimer = setInterval(() => this.clearExpiredSessions(), this.reapInterval);
    }
    
    async clearExpiredSessions() {
      try {
        const now = new Date().toISOString();
        const { error } = await this.supabase
          .from(this.tableName)
          .delete()
          .lt('expired', now);
        
        if (error) throw error;
        console.log(`Cleared expired sessions from ${this.tableName}`);
      } catch (err) {
        console.error('Error clearing expired sessions:', err);
      }
    }
    
    async get(sid, callback) {
      try {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select('sess')
          .eq('sid', sid)
          .single();
          
        if (error) throw error;
        callback(null, data ? data.sess : null);
      } catch (err) {
        callback(err);
      }
    }
    
    async set(sid, sess, callback) {
      try {
        const expires = sess.cookie.expires
          ? new Date(sess.cookie.expires)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default
          
        const sessionData = {
          sid,
          sess,
          expired: expires.toISOString()
        };
        
        const { error } = await this.supabase
          .from(this.tableName)
          .upsert(sessionData);
          
        if (error) throw error;
        callback(null);
      } catch (err) {
        callback(err);
      }
    }
    
    async destroy(sid, callback) {
      try {
        const { error } = await this.supabase
          .from(this.tableName)
          .delete()
          .eq('sid', sid);
          
        if (error) throw error;
        callback(null);
      } catch (err) {
        callback(err);
      }
    }
    
    async all(callback) {
      try {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select('*');
          
        if (error) throw error;
        callback(null, data.map(session => session.sess));
      } catch (err) {
        callback(err);
      }
    }
  };
};