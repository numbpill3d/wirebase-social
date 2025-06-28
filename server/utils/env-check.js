function checkRequiredEnv() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SESSION_SECRET'
  ];

  const missing = requiredVars.filter(v => !process.env[v] || !process.env[v].trim());

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = checkRequiredEnv;
