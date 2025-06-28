/**
 * Environment variable validation utility for Wirebase
 * Ensures that all required variables are defined before the server starts
 */

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SESSION_SECRET',
  'PORT',
  'NODE_ENV'
];

/**
 * Validate environment variables
 * @param {string[]} vars - List of variables to validate
 * @returns {boolean} - True if all variables are present
 */
const validateEnv = (vars = requiredVars) => {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

module.exports = {
  validateEnv,
  requiredVars
};
