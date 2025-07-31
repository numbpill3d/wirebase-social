/**
 * Migration script to create the forum tables
 */

const { supabaseAdmin } = require('../../server/utils/database');

async function createForumTables() {
  try {
console.log('Running create_forum_tables RPC...');
const { data, error } = await supabaseAdmin.rpc('create_forum_tables');

if (error) {
  console.error('Error running create_forum_tables RPC:', error);
  return { success: false, error: error.message };
}

console.log('create_forum_tables RPC executed successfully');
return { success: true, message: 'Forum tables migration completed', data };

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
