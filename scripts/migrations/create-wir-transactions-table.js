/**
 * Migration script to create the market_wir_transactions table
 */

const { supabaseAdmin } = require('../../server/utils/database');

async function createWIRTransactionsTable() {
  try {
    console.log('Checking if market_wir_transactions table exists...');
    
    // Check if table exists
    const { error } = await supabaseAdmin
      .from('market_wir_transactions')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating market_wir_transactions table...');
      
const { error: createError } = await supabaseAdmin.rpc('execute_sql', {
  sql: `
    BEGIN;
    CREATE TABLE market_wir_transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      reference_id UUID,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      -- Add constraints
      CONSTRAINT valid_transaction_type CHECK (
        transaction_type IN (
          'purchase',
          'sale',
          'transfer',
          'reward',
          'listing_fee',
          'featured_fee',
          'loot_to_wir_conversion',
          'wir_to_loot_conversion'
        )
      )
    );

    -- Create indexes
    CREATE INDEX idx_wir_transactions_user_id ON market_wir_transactions(user_id);
    CREATE INDEX idx_wir_transactions_reference_id ON market_wir_transactions(reference_id);
    CREATE INDEX idx_wir_transactions_created_at ON market_wir_transactions(created_at);
    CREATE INDEX idx_wir_transactions_type ON market_wir_transactions(transaction_type);
    COMMIT;
  `
});

if (createError) {
  throw new Error(`market_wir_transactions migration failed: ${createError.message}`);
}

      
      console.log('market_wir_transactions table created successfully!');
    } else {
      console.log('market_wir_transactions table already exists.');
    }
    
    return { error: null };
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
