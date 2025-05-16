/**
 * Run Vivid Market Migration
 * 
 * This script runs the database migration for the Vivid Market.
 * It creates the necessary tables and columns for the marketplace.
 */

const { runMigration } = require('./vivid-market-migration');

console.log('Starting Vivid Market migration...');

runMigration()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });