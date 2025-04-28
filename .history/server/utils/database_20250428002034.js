const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client with anonymous key (for client-side operations)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase admin client with service role key (for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Initialize database tables if they don't exist
 */
async function initializeDatabase() {
  try {
    // Try to directly check if the users table exists instead of using RPC
    console.log('Checking if users table exists...');
    const { error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
        
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('Creating users table...');
      await supabaseAdmin.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          display_name TEXT,
          profile_html TEXT,
          profile_css TEXT,
          avatar TEXT DEFAULT '/images/default-avatar.png',
          custom_glyph TEXT DEFAULT '⚔️',
          status_message TEXT DEFAULT 'Just joined Wirebase',
          status_icon TEXT DEFAULT 'online',
          loot_tokens INTEGER DEFAULT 10,
          badges JSONB DEFAULT '[]'::jsonb,
          followers JSONB DEFAULT '[]'::jsonb,
          following JSONB DEFAULT '[]'::jsonb,
          streetpass_visitors JSONB DEFAULT '[]'::jsonb,
          streetpass_enabled BOOLEAN DEFAULT true,
          custom_emotes JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          role TEXT DEFAULT 'user'
        );
        
        -- Add extension for UUID support if not exists
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Create index on username and email
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `);
    }
    
    // Create scrapyard_items table if not exists
    const { error: itemsError } = await supabaseAdmin
      .from('scrapyard_items')
      .select('id')
      .limit(1);
      
    if (itemsError && itemsError.code === '42P01') { // Table doesn't exist
      console.log('Creating scrapyard_items table...');
      await supabaseAdmin.query(`
        CREATE TABLE scrapyard_items (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          creator UUID NOT NULL REFERENCES users(id),
          category TEXT NOT NULL,
          content TEXT NOT NULL,
          preview_image TEXT,
          upvotes JSONB DEFAULT '[]'::jsonb,
          downvotes JSONB DEFAULT '[]'::jsonb,
          price INTEGER DEFAULT 0,
          tags JSONB DEFAULT '[]'::jsonb,
          usage_count INTEGER DEFAULT 0,
          downloads INTEGER DEFAULT 0,
          comments JSONB DEFAULT '[]'::jsonb,
          featured BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_scrapyard_items_creator ON scrapyard_items(creator);
        CREATE INDEX IF NOT EXISTS idx_scrapyard_items_category ON scrapyard_items(category);
      `);
    }
    
    // Create sessions table if not exists
    const { error: sessionsError } = await supabaseAdmin
      .from('sessions')
      .select('sid')
      .limit(1);
      
    if (sessionsError && sessionsError.code === '42P01') { // Table doesn't exist
      console.log('Creating sessions table...');
      await supabaseAdmin.query(`
        CREATE TABLE sessions (
          sid varchar NOT NULL PRIMARY KEY,
          sess json NOT NULL,
          expired timestamp(6) with time zone NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired);
      `);
    }
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Call this function when the app starts
initializeDatabase().catch(console.error);

module.exports = {
  supabase,
  supabaseAdmin
};