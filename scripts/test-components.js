/**
 * Wirebase Component Test Script
 * 
 * This script tests the integration and functionality of various components
 * in the Wirebase application to ensure they work together harmoniously.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const { JSDOM } = require('jsdom');

// Configuration
const config = {
  publicDir: path.join(__dirname, '../public'),
  serverDir: path.join(__dirname, '../server'),
  cssDir: path.join(__dirname, '../public/css'),
  jsDir: path.join(__dirname, '../public/js'),
  viewsDir: path.join(__dirname, '../server/views'),
  testsDir: path.join(__dirname, '../tests')
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Helper functions
function logResult(test, passed, message) {
  const result = {
    test,
    passed,
    message
  };
  
  results.details.push(result);
  
  if (passed) {
    results.passed++;
    console.log(`✅ PASS: ${test}`);
  } else {
    results.failed++;
    console.error(`❌ FAIL: ${test} - ${message}`);
  }
}

function logWarning(test, message) {
  results.warnings++;
  console.warn(`⚠️ WARNING: ${test} - ${message}`);
  
  results.details.push({
    test,
    passed: null,
    message
  });
}

// Test functions
async function testCSSIntegration() {
  try {
    // Check if all required CSS files exist
    const requiredCssFiles = [
      'cyber-variables.css',
      'interface.css',
      'accessibility.css',
      'laincore.css',
      'scanlines.css',
      'widgets.css'
    ];
    
    for (const file of requiredCssFiles) {
      const filePath = path.join(config.cssDir, file);
      const exists = fs.existsSync(filePath);
      
      logResult(
        `CSS File Exists: ${file}`,
        exists,
        exists ? 'File exists' : `File not found: ${filePath}`
      );
      
      if (exists) {
        // Check if file is not empty
        const content = await readFile(filePath, 'utf8');
        logResult(
          `CSS File Not Empty: ${file}`,
          content.trim().length > 0,
          content.trim().length > 0 ? 'File has content' : `File is empty: ${filePath}`
        );
      }
    }
    
    // Check for CSS variable consistency
    const variablesFile = await readFile(path.join(config.cssDir, 'cyber-variables.css'), 'utf8');
    const otherCssFiles = await Promise.all(
      requiredCssFiles
        .filter(file => file !== 'cyber-variables.css')
        .map(file => readFile(path.join(config.cssDir, file), 'utf8'))
    );
    
    // Extract variables from cyber-variables.css
    const variableRegex = /--[\w-]+/g;
    const definedVariables = new Set();
    let match;
    
    while ((match = variableRegex.exec(variablesFile)) !== null) {
      definedVariables.add(match[0]);
    }
    
    // Check if variables used in other files are defined
    const undefinedVariables = new Set();
    
    for (const cssContent of otherCssFiles) {
      while ((match = variableRegex.exec(cssContent)) !== null) {
        const variable = match[0];
        if (!definedVariables.has(variable)) {
          undefinedVariables.add(variable);
        }
      }
    }
    
    logResult(
      'CSS Variables Consistency',
      undefinedVariables.size === 0,
      undefinedVariables.size === 0 
        ? 'All CSS variables are properly defined' 
        : `Found undefined variables: ${Array.from(undefinedVariables).join(', ')}`
    );
  } catch (error) {
    logResult('CSS Integration', false, `Error testing CSS integration: ${error.message}`);
  }
}

async function testJSIntegration() {
  try {
    // Check if all required JS files exist
    const requiredJsFiles = [
      'main.js',
      'laincore-loader.js',
      'loading-states.js',
      'widgets.js'
    ];
    
    for (const file of requiredJsFiles) {
      const filePath = path.join(config.jsDir, file);
      const exists = fs.existsSync(filePath);
      
      logResult(
        `JS File Exists: ${file}`,
        exists,
        exists ? 'File exists' : `File not found: ${filePath}`
      );
      
      if (exists) {
        // Check if file is not empty
        const content = await readFile(filePath, 'utf8');
        logResult(
          `JS File Not Empty: ${file}`,
          content.trim().length > 0,
          content.trim().length > 0 ? 'File has content' : `File is empty: ${filePath}`
        );
        
        // Check for syntax errors
        try {
          new Function(content);
          logResult(`JS Syntax Valid: ${file}`, true, 'No syntax errors detected');
        } catch (syntaxError) {
          logResult(`JS Syntax Valid: ${file}`, false, `Syntax error: ${syntaxError.message}`);
        }
      }
    }
    
    // Check for function references between files
    const mainJs = await readFile(path.join(config.jsDir, 'main.js'), 'utf8');
    
    // Extract function definitions from main.js
    const functionDefRegex = /function\s+(\w+)\s*\(/g;
    const definedFunctions = new Set();
    let match;
    
    while ((match = functionDefRegex.exec(mainJs)) !== null) {
      definedFunctions.add(match[1]);
    }
    
    // Check for function calls that might not be defined
    const functionCallRegex = /(\w+)\s*\(/g;
    const potentialUndefinedCalls = new Set();
    
    while ((match = functionCallRegex.exec(mainJs)) !== null) {
      const funcName = match[1];
      // Ignore built-in functions and methods
      if (!definedFunctions.has(funcName) && 
          !['if', 'for', 'while', 'switch', 'console', 'document', 'window', 'Math', 'Date', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'fetch', 'Promise'].includes(funcName) &&
          !funcName.startsWith('set') && 
          !funcName.startsWith('get')) {
        potentialUndefinedCalls.add(funcName);
      }
    }
    
    if (potentialUndefinedCalls.size > 0) {
      logWarning(
        'JS Function References',
        `Potential undefined function calls: ${Array.from(potentialUndefinedCalls).join(', ')}`
      );
    } else {
      logResult('JS Function References', true, 'No potential undefined function calls detected');
    }
  } catch (error) {
    logResult('JS Integration', false, `Error testing JS integration: ${error.message}`);
  }
}

async function testHandlebarsTemplates() {
  try {
    // Check if main layout exists
    const mainLayoutPath = path.join(config.viewsDir, 'layouts', 'main.handlebars');
    const mainLayoutExists = fs.existsSync(mainLayoutPath);
    
    logResult(
      'Main Layout Exists',
      mainLayoutExists,
      mainLayoutExists ? 'Main layout exists' : 'Main layout not found'
    );
    
    if (mainLayoutExists) {
      const mainLayout = await readFile(mainLayoutPath, 'utf8');
      
      // Check for required elements in main layout
      const requiredElements = [
        { name: 'DOCTYPE declaration', regex: /<!DOCTYPE html>/i },
        { name: 'HTML lang attribute', regex: /<html\s+lang="[^"]+"/i },
        { name: 'Viewport meta tag', regex: /<meta\s+name="viewport"/i },
        { name: 'Main content placeholder', regex: /\{\{\{body\}\}\}/i },
        { name: 'CSS includes', regex: /<link\s+rel="stylesheet"/i },
        { name: 'JS includes', regex: /<script\s+src="/i }
      ];
      
      for (const element of requiredElements) {
        const hasElement = element.regex.test(mainLayout);
        logResult(
          `Layout Has ${element.name}`,
          hasElement,
          hasElement ? `Layout has ${element.name}` : `Layout missing ${element.name}`
        );
      }
    }
  } catch (error) {
    logResult('Handlebars Templates', false, `Error testing Handlebars templates: ${error.message}`);
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Wirebase component tests...\n');
  
  await testCSSIntegration();
  await testJSIntegration();
  await testHandlebarsTemplates();
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️ Warnings: ${results.warnings}`);
  
  // Write results to file
  const resultsPath = path.join(config.testsDir, 'component-test-results.json');
  await writeFile(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results written to: ${resultsPath}`);
  
  return results.failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
