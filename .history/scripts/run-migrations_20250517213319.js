/**
 * Run all database migrations
 */

const createStreetpassTable = require('./migrations/create-streetpass-table');

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Run Streetpass table migration
    console.log('\n=== Running Streetpass table migration ===');
    const streetpassResult = await createStreetpassTable();
    console.log('Result:', streetpassResult);
    
    // Add more migrations here as needed
    
    console.log('\nAll migrations completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(result => {
      if (result.success) {
        console.log('All migrations completed successfully!');
        process.exit(0);
      } else {
        console.error('Migration failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error during migration:', error);
      process.exit(1);
    });
}

module.exports = runMigrations;
