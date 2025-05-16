/**
 * Database transaction utility for Wirebase
 * Provides a consistent way to handle database transactions
 */

const knex = require('../../server').knex;

/**
 * Execute a function within a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise<any>} - Result of the callback function
 */
const withTransaction = async (callback) => {
  const trx = await knex.transaction();
  
  try {
    const result = await callback(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    console.error('Transaction error:', error);
    throw error;
  }
};

/**
 * Execute a database query with automatic connection management
 * @param {Function} queryFn - Function that performs the database query
 * @returns {Promise<any>} - Result of the query
 */
const executeQuery = async (queryFn) => {
  try {
    return await queryFn(knex);
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

module.exports = {
  withTransaction,
  executeQuery
};
