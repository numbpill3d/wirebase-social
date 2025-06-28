/**
 * Migration script to create the forum tables
 */

const { supabaseAdmin } = require('../../server/utils/database');

async function createForumTables() {
  try {
    console.log('Checking if forum tables exist...');
    
    // Check if forum_threads table exists
    const { error: threadsError } = await supabaseAdmin
      .from('forum_threads')
      .select('id')
      .limit(1);
    
    if (threadsError && threadsError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating forum_threads table...');
      
      const { error: createError } = await supabaseAdmin.rpc('sql', {
        q: `
          BEGIN;
          CREATE TABLE forum_threads (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            creator_id UUID NOT NULL REFERENCES users(id),
            tags JSONB DEFAULT '[]'::jsonb,
            views INTEGER DEFAULT 0,
            is_pinned BOOLEAN DEFAULT false,
            is_locked BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX idx_forum_threads_category ON forum_threads(category);
          CREATE INDEX idx_forum_threads_creator_id ON forum_threads(creator_id);
          CREATE INDEX idx_forum_threads_created_at ON forum_threads(created_at);
          CREATE INDEX idx_forum_threads_updated_at ON forum_threads(updated_at);
          COMMIT;
        `
      });

      if (createError) {
      
      console.log('forum_threads table created successfully!');
    } else {
      console.log('forum_threads table already exists.');
    }
    
    // Check if forum_replies table exists
    const { error: repliesError } = await supabaseAdmin
      .from('forum_replies')
      .select('id')
      .limit(1);
    
    if (repliesError && repliesError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating forum_replies table...');
      
      const { error: replyCreateError } = await supabaseAdmin.rpc('sql', {
        q: `
          CREATE TABLE forum_replies (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            creator_id UUID NOT NULL REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX idx_forum_replies_thread_id ON forum_replies(thread_id);
          CREATE INDEX idx_forum_replies_creator_id ON forum_replies(creator_id);
          CREATE INDEX idx_forum_replies_created_at ON forum_replies(created_at);
        `
      });

      if (replyCreateError) {
      
      console.log('forum_replies table created successfully!');
    } else {
      console.log('forum_replies table already exists.');
    }
    
    // Check if forum_categories table exists
    const { error: categoriesError } = await supabaseAdmin
      .from('forum_categories')
      .select('id')
      .limit(1);
    
    if (categoriesError && categoriesError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating forum_categories table...');
      
      const { error: catCreateError } = await supabaseAdmin.rpc('sql', {
        q: `
          CREATE TABLE forum_categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            icon TEXT,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create index
          CREATE INDEX idx_forum_categories_display_order ON forum_categories(display_order);
        `
      });

      if (catCreateError) {
      
      // Insert default categories
      await supabaseAdmin.from('forum_categories').insert([
        {
          name: 'general',
          description: 'General discussion about Wirebase',
          icon: '💬',
          display_order: 1
        },
        {
          name: 'tech',
          description: 'Technical discussions and help',
          icon: '💻',
          display_order: 2
        },
        {
          name: 'creative',
          description: 'Share your creative projects and ideas',
          icon: '🎨',
          display_order: 3
        },
        {
          name: 'meta',
          description: 'Discussions about the forum itself',
          icon: '🔄',
          display_order: 4
        }
      ]);
      
      console.log('forum_categories table created and populated successfully!');
    } else {
      console.log('forum_categories table already exists.');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error creating forum tables:', error);
    return { error: error.message };
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  createForumTables()
    .then(result => {
      console.log(result);
      process.exit(result.error ? 1 : 0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createForumTables;
