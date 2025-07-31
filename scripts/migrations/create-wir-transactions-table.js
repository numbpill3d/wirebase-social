/**
 * Migration script to create the market_wir_transactions table
 */

const { supabaseAdmin } = require('../../server/utils/database');

async function createWIRTransactionsTable() {
  try {
console.log('Running create_wir_transactions_table RPC...');
const { data, error } = await supabaseAdmin.rpc('create_wir_transactions_table');

if (error) {
  console.error('Error running create_wir_transactions_table RPC:', error);
  return { success: false, error: error.message };
}

console.log('create_wir_transactions_table RPC executed successfully');
return { success: true, message: 'WIR transactions table migration completed', data };

  } catch (error) {
    console.error('Error creating market_wir_transactions table:', error);
    return { error: error.message };
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  createWIRTransactionsTable()
    .then(result => {
      console.log(result);
      process.exit(result.error ? 1 : 0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createWIRTransactionsTable;
