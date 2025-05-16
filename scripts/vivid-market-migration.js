/**
 * Vivid Market Database Migration Script
 * 
 * This script sets up the necessary database tables and columns for the Vivid Market:
 * - Creates new tables: collections, wishlists, transactions, purchases
 * - Adds new columns to existing tables: users, scrapyard_items
 */

const { supabaseAdmin } = require('../server/utils/database');

async function runMigration() {
  console.log('Starting Vivid Market database migration...');

  try {
    // 1. Add new columns to users table
    console.log('Adding WIR-related columns to users table...');
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'users',
      column_name: 'wir_balance',
      column_type: 'integer',
      column_default: '100'
    });
    
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'users',
      column_name: 'wir_transactions',
      column_type: 'uuid[]',
      column_default: '{}' 
    });
    
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'users',
      column_name: 'collections',
      column_type: 'uuid[]',
      column_default: '{}'
    });
    
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'users',
      column_name: 'wishlist_id',
      column_type: 'uuid',
      column_default: 'null'
    });
    
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'users',
      column_name: 'selling_items',
      column_type: 'uuid[]',
      column_default: '{}'
    });
    
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'users',
      column_name: 'purchased_items',
      column_type: 'uuid[]',
      column_default: '{}'
    });

    // 2. Add new columns to scrapyard_items table
    console.log('Adding marketplace columns to scrapyard_items table...');
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'scrapyard_items',
      column_name: 'wir_price',
      column_type: 'integer',
      column_default: '0'
    });
    
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'scrapyard_items',
      column_name: 'marketplace_status',
      column_type: 'text',
      column_default: "'available'"
    });
    
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'scrapyard_items',
      column_name: 'collection_id',
      column_type: 'uuid',
      column_default: 'null'
    });
    
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'scrapyard_items',
      column_name: 'views',
      column_type: 'integer',
      column_default: '0'
    });
    
    await supabaseAdmin.rpc('add_column_if_not_exists', {
      table_name: 'scrapyard_items',
      column_name: 'featured_in_market',
      column_type: 'boolean',
      column_default: 'false'
    });

    // 3. Create collections table
    console.log('Creating collections table...');
    const { error: collectionsError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'collections',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        name text not null,
        description text,
        creator uuid references users(id) on delete cascade not null,
        items uuid[] default '{}',
        cover_image text,
        is_public boolean default true,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      `
    });
    
    if (collectionsError) {
      console.error('Error creating collections table:', collectionsError);
    }

    // 4. Create wishlists table
    console.log('Creating wishlists table...');
    const { error: wishlistsError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'wishlists',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references users(id) on delete cascade not null,
        items uuid[] default '{}',
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      `
    });
    
    if (wishlistsError) {
      console.error('Error creating wishlists table:', wishlistsError);
    }

    // 5. Create transactions table
    console.log('Creating transactions table...');
    const { error: transactionsError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'transactions',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        sender_id uuid references users(id) not null,
        receiver_id uuid references users(id) not null,
        item_id uuid references scrapyard_items(id),
        amount integer not null,
        transaction_type text not null,
        status text not null,
        notes text,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      `
    });
    
    if (transactionsError) {
      console.error('Error creating transactions table:', transactionsError);
    }

    // 6. Create purchases table
    console.log('Creating purchases table...');
    const { error: purchasesError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'purchases',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        buyer_id uuid references users(id) not null,
        seller_id uuid references users(id) not null,
        item_id uuid references scrapyard_items(id) not null,
        transaction_id uuid references transactions(id) not null,
        price integer not null,
        status text not null,
        notes text,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      `
    });
    
    if (purchasesError) {
      console.error('Error creating purchases table:', purchasesError);
    }

    // 7. Create stored procedure for adding columns if they don't exist
    console.log('Creating add_column_if_not_exists function...');
    const { error: functionError } = await supabaseAdmin.rpc('create_function_if_not_exists', {
      function_name: 'add_column_if_not_exists',
      function_definition: `
        CREATE OR REPLACE FUNCTION add_column_if_not_exists(
          table_name text,
          column_name text,
          column_type text,
          column_default text DEFAULT NULL
        )
        RETURNS void AS $$
        DECLARE
          column_exists boolean;
          alter_statement text;
        BEGIN
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = $1
            AND column_name = $2
          ) INTO column_exists;
          
          IF NOT column_exists THEN
            alter_statement := 'ALTER TABLE ' || table_name || ' ADD COLUMN ' || column_name || ' ' || column_type;
            
            IF column_default IS NOT NULL THEN
              alter_statement := alter_statement || ' DEFAULT ' || column_default;
            END IF;
            
            EXECUTE alter_statement;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (functionError) {
      console.error('Error creating add_column_if_not_exists function:', functionError);
    }

    // 8. Create stored procedure for creating tables if they don't exist
    console.log('Creating create_table_if_not_exists function...');
    const { error: tableCreateFunctionError } = await supabaseAdmin.rpc('create_function_if_not_exists', {
      function_name: 'create_table_if_not_exists',
      function_definition: `
        CREATE OR REPLACE FUNCTION create_table_if_not_exists(
          table_name text,
          columns text
        )
        RETURNS void AS $$
        DECLARE
          table_exists boolean;
          create_statement text;
        BEGIN
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = $1
          ) INTO table_exists;
          
          IF NOT table_exists THEN
            create_statement := 'CREATE TABLE ' || table_name || ' (' || columns || ')';
            EXECUTE create_statement;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (tableCreateFunctionError) {
      console.error('Error creating create_table_if_not_exists function:', tableCreateFunctionError);
    }

    // 9. Create stored procedure for creating functions if they don't exist
    console.log('Creating create_function_if_not_exists function...');
    const { error: functionCreateFunctionError } = await supabaseAdmin.rpc('create_function_if_not_exists', {
      function_name: 'create_function_if_not_exists',
      function_definition: `
        CREATE OR REPLACE FUNCTION create_function_if_not_exists(
          function_name text,
          function_definition text
        )
        RETURNS void AS $$
        DECLARE
          function_exists boolean;
        BEGIN
          SELECT EXISTS (
            SELECT 1
            FROM pg_proc
            WHERE proname = $1
          ) INTO function_exists;
          
          IF NOT function_exists THEN
            EXECUTE function_definition;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (functionCreateFunctionError) {
      console.error('Error creating create_function_if_not_exists function:', functionCreateFunctionError);
    }

    console.log('Vivid Market database migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration completed, exiting...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };