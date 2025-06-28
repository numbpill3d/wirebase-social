function checkRequiredEnv() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SESSION_SECRET'
  ];

  const missing = requiredVars.filter(v => !process.env[v] || !process.env[v].trim());

  if (missing.length > 0) {
    const error = new Error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error(error.message);
    throw error;
  }
}

module.exports = checkRequiredEnv;
