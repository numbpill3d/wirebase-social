/**
 * WIR Transactions Tests
 * Tests for the WIR currency system and transactions
 */

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'key';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'service';

const { supabase } = require('../server/utils/database');
const WIRTransaction = require('../server/models/WIRTransaction');
const createWIRTransactionsTable = require('../scripts/migrations/create-wir-transactions-table');

describe('WIR Transactions', () => {
  // Test user IDs
  const testSenderId = '00000000-0000-0000-0000-000000000001';
  const testReceiverId = '00000000-0000-0000-0000-000000000002';
  
  // Clean up test data after tests
  afterAll(async () => {
    // Delete test transactions
    await supabase
      .from('market_wir_transactions')
      .delete()
      .in('user_id', [testSenderId, testReceiverId]);
  });
  
  describe('Database Migration', () => {
    it('should create the market_wir_transactions table if it does not exist', async () => {
      // Run the migration
      const result = await createWIRTransactionsTable();
      
      // Check if the migration was successful
      expect(result.success).toBe(true);
      
      // Verify the table exists by trying to select from it
      const { error } = await supabase
        .from('market_wir_transactions')
        .select('id')
        .limit(1);
      
      expect(error).toBeNull();
    });
    
    it('should have the correct columns in the market_wir_transactions table', async () => {
      // Get table information
      const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: 'market_wir_transactions'
      });
      
      // Check if the query was successful
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      // Extract column names
      const columnNames = data.map(col => col.column_name);
      
      // Check required columns
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('amount');
      expect(columnNames).toContain('transaction_type');
      expect(columnNames).toContain('reference_id');
      expect(columnNames).toContain('notes');
      expect(columnNames).toContain('created_at');
    });
  });
  
  describe('WIRTransaction Model', () => {
    it('should create a new transaction', async () => {
      // Create a test transaction
      const transactionData = {
        user_id: testSenderId,
        amount: 100,
        transaction_type: 'reward',
        notes: 'Test transaction'
      };
      
      const transaction = await WIRTransaction.create(transactionData);
      
      // Check if the transaction was created
      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      
      // Verify the transaction in the database
      const { data, error } = await supabase
        .from('market_wir_transactions')
        .select('*')
        .eq('id', transaction.id)
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe(testSenderId);
      expect(data.amount).toBe(100);
      expect(data.transaction_type).toBe('reward');
      expect(data.notes).toBe('Test transaction');
    });
    
    it('should get transactions by user', async () => {
      // Create a few test transactions for the user
      const transactionData1 = {
        user_id: testSenderId,
        amount: 50,
        transaction_type: 'reward',
        notes: 'Test transaction 1'
      };
      
      const transactionData2 = {
        user_id: testSenderId,
        amount: -20,
        transaction_type: 'purchase',
        notes: 'Test transaction 2'
      };
      
      await WIRTransaction.create(transactionData1);
      await WIRTransaction.create(transactionData2);
      
      // Get transactions for the user
      const { transactions, total } = await WIRTransaction.getByUser(testSenderId);
      
      // Check if transactions were retrieved
      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThanOrEqual(2);
      expect(total).toBeGreaterThanOrEqual(2);
      
      // Check if the transactions contain the expected data
      const foundTransaction1 = transactions.some(t => 
        t.amount === 50 && t.transaction_type === 'reward' && t.notes === 'Test transaction 1'
      );
      
      const foundTransaction2 = transactions.some(t => 
        t.amount === -20 && t.transaction_type === 'purchase' && t.notes === 'Test transaction 2'
      );
      
      expect(foundTransaction1).toBe(true);
      expect(foundTransaction2).toBe(true);
    });
    
    it('should convert between WIR and Loot tokens', async () => {
      // Mock user data
      const mockUser = {
        id: testSenderId,
        wir_balance: 200,
        loot_tokens: 100
      };
      
      // Mock the supabase query for getting user
      jest.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null })
              })
            }),
            update: () => ({
              eq: () => Promise.resolve({ error: null })
            })
          };
        }
        
        // Return the actual implementation for other tables
        return supabase.from(table);
      });
      
      // Test Loot to WIR conversion
      const lootToWirResult = await WIRTransaction.convert(testSenderId, 'lootToWir', 50);
      
      expect(lootToWirResult.success).toBe(true);
      expect(lootToWirResult.newWirBalance).toBe(250); // 200 + 50
      expect(lootToWirResult.newLootBalance).toBe(50); // 100 - 50
      
      // Test WIR to Loot conversion
      const wirToLootResult = await WIRTransaction.convert(testSenderId, 'wirToLoot', 100);
      
      expect(wirToLootResult.success).toBe(true);
      expect(wirToLootResult.newWirBalance).toBe(150); // 250 - 100
      expect(wirToLootResult.newLootBalance).toBe(150); // 50 + 100
      
      // Restore the original implementation
      jest.restoreAllMocks();
    });
  });
});
