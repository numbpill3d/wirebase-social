/**
 * Migration script to create the site_visits table
 */

const { supabaseAdmin } = require('../../server/utils/database');

async function createTrafficTable() {
  try {
    console.log('Checking if site_visits table exists...');

    // Check if table exists using information_schema
    const { data: tableExistsData, error: tableExistsError } = await supabaseAdmin
      .rpc('execute_sql', { sql: `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'site_visits'
        ) AS exists;
      ` });

    if (tableExistsError) {
      throw tableExistsError;
    }

    // The result may be in different formats depending on the driver, so check accordingly
    const exists = Array.isArray(tableExistsData)
      ? (tableExistsData[0]?.exists === true || tableExistsData[0]?.exists === 't')
      : false;

    if (!exists) {
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
