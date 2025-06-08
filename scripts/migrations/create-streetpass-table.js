/**
 * Migration script to create the streetpass_visits table
 */

const { supabaseAdmin } = require('../../server/utils/database');

async function createStreetpassTable() {
  try {
    console.log('Running create_streetpass_table RPC...');
    const { data, error } = await supabaseAdmin.rpc('create_streetpass_table');

    if (error) {
      console.error('Error running create_streetpass_table RPC:', error);
      return { success: false, error: error.message };
    }

    console.log('create_streetpass_table RPC executed successfully');
    return { success: true, message: 'Streetpass table migration completed', data };
  } catch (error) {
    console.error('Error creating streetpass_visits table:', error);
    return { success: false, error: error.message };
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  createStreetpassTable()
    .then(result => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createStreetpassTable;
