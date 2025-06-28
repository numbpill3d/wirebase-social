/**
 * Migration script to create the streetpass_visits table
 */

const { supabaseAdmin } = require('../../server/utils/database');

async function createStreetpassTable() {
  try {
    console.log('Checking if streetpass_visits table exists...');
    
    // Check if table exists
    const { error } = await supabaseAdmin
      .from('streetpass_visits')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating streetpass_visits table...');
      
const { error: createError } = await supabaseAdmin.rpc('execute_sql', {
  sql: `
    BEGIN;
    CREATE TABLE streetpass_visits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      visitor_id UUID NOT NULL REFERENCES users(id),
      profile_id UUID NOT NULL REFERENCES users(id),
      emote TEXT,
      visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      -- Add constraints
      CONSTRAINT unique_visitor_profile UNIQUE (visitor_id, profile_id),
      CONSTRAINT no_self_visits CHECK (visitor_id != profile_id)
    );

    -- Create indexes
    CREATE INDEX idx_streetpass_visits_profile_id ON streetpass_visits(profile_id);
    CREATE INDEX idx_streetpass_visits_visitor_id ON streetpass_visits(visitor_id);
    CREATE INDEX idx_streetpass_visits_visited_at ON streetpass_visits(visited_at);
    COMMIT;
  `
});

if (createError) {
  throw new Error(\`Streetpass visits table migration failed: \${createError.message}\`);
}

      
      console.log('streetpass_visits table created successfully!');
    } else {
      console.log('streetpass_visits table already exists.');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error creating streetpass_visits table:', error);
    return { error: error.message };
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  createStreetpassTable()
    .then(result => {
      console.log(result);
      process.exit(result.error ? 1 : 0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createStreetpassTable;
