/**
 * Migration script to create the site_visits table
 */

const { supabaseAdmin } = require('../../server/utils/database');

async function createTrafficTable() {
  try {
    console.log('Checking if site_visits table exists...');

    // Check if table exists
    const { error } = await supabaseAdmin
      .from('site_visits')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('Creating site_visits table...');

      await supabaseAdmin.rpc('execute_sql', { sql: `
        CREATE TABLE site_visits (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          path TEXT NOT NULL,
          visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_site_visits_path ON site_visits(path);
        CREATE INDEX idx_site_visits_visited_at ON site_visits(visited_at);
      ` });

      console.log('site_visits table created successfully!');
    } else {
      console.log('site_visits table already exists.');
    }

    return { success: true, message: 'Traffic table migration completed' };
  } catch (error) {
    console.error('Error creating site_visits table:', error);
    return { success: false, error: error.message };
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  createTrafficTable()
    .then(result => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createTrafficTable;
