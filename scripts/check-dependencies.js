/**
 * Script to check for missing dependencies in the codebase
 * Run with: node scripts/check-dependencies.js
 */
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Load package.json to get current dependencies
const packageJson = require('../package.json');
const dependencies = Object.keys(packageJson.dependencies || {});
const devDependencies = Object.keys(packageJson.devDependencies || {});
const allDependencies = [...dependencies, ...devDependencies];

// Common Node.js built-in modules to ignore
const builtInModules = [
  'fs', 'path', 'http', 'https', 'util', 'crypto', 'os', 'stream', 'events',
  'buffer', 'querystring', 'url', 'zlib', 'assert', 'child_process', 'cluster',
  'dgram', 'dns', 'domain', 'net', 'readline', 'repl', 'string_decoder', 'tls',
  'tty', 'vm', 'process'
];

// Regular expression to find require statements
const requireRegex = /require\(['"]([^'"./][^'"]*)['"]\)/g;
const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"./][^'"]*)['"]/g;

// Track missing dependencies
const missingDependencies = new Set();

// Function to check a file for missing dependencies
async function checkFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let match;
    
    // Check require statements
    while ((match = requireRegex.exec(content)) !== null) {
      const moduleName = match[1].split('/')[0]; // Get the base module name
      if (!allDependencies.includes(moduleName) && !builtInModules.includes(moduleName)) {
        missingDependencies.add(moduleName);
      }
    }
    
    // Check import statements
    while ((match = importRegex.exec(content)) !== null) {
      const moduleName = match[1].split('/')[0]; // Get the base module name
      if (!allDependencies.includes(moduleName) && !builtInModules.includes(moduleName)) {
        missingDependencies.add(moduleName);
      }
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err.message);
  }
}

// Function to recursively scan directories
async function scanDirectory(dir) {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        // Skip node_modules and .git directories
        if (file !== 'node_modules' && file !== '.git' && file !== '.history') {
          await scanDirectory(filePath);
        }
      } else if (file.endsWith('.js')) {
        await checkFile(filePath);
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err.message);
  }
}

// Main function
async function main() {
  console.log('Checking for missing dependencies...');
  
  // Start from the project root
  await scanDirectory(path.join(__dirname, '..'));
  
  if (missingDependencies.size > 0) {
    console.log('\nMissing dependencies found:');
    console.log(Array.from(missingDependencies).join('\n'));
    console.log('\nRun the following command to install them:');
    console.log(`npm install ${Array.from(missingDependencies).join(' ')}`);
  } else {
    console.log('No missing dependencies found!');
  }
}

main().catch(console.error);
