/**
 * Database transaction utility for Wirebase
 * Provides a consistent way to handle database transactions
 */

const knex = require('../../server').knex;

/**
 * Execute a function within a transaction
 * @param {Function} callback - Function to execute within transaction
 * @param {Object} options - Transaction options
 * @returns {Promise<any>} - Result of the callback function
 */
const withTransaction = async (callback, options = {}) => {
  // Set default transaction options
  const txOptions = {
    isolationLevel: 'read committed', // Default isolation level
    ...options
  };

  // Create transaction with timeout
  const trx = await knex.transaction(txOptions);

  try {
    // Execute callback with transaction
    const result = await callback(trx);
    // Commit transaction
    await trx.commit();
    return result;
  } catch (error) {
    // Rollback transaction on error
    try {
      await trx.rollback();
    } catch (rollbackError) {
      console.error('Transaction rollback error:', rollbackError);
    }
    console.error('Transaction error:', error);
    throw error;
  }
};

/**
 * Execute a database query with automatic connection management
 * @param {Function} queryFn - Function that performs the database query
 * @param {number} timeout - Query timeout in milliseconds
 * @returns {Promise<any>} - Result of the query
 */
const executeQuery = async (queryFn, timeout = 30000) => {
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Query timed out after ${timeout}ms`)), timeout);
  });

  try {
    // Race the query against the timeout
    return await Promise.race([
      queryFn(knex),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

module.exports = {
  withTransaction,
  executeQuery,
  knex // Export knex for direct access when needed
};
