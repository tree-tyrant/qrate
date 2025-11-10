#!/usr/bin/env node
/**
 * Test script for Spotify OAuth endpoints in QRATE
 * Tests both Guest and DJ authentication endpoints
 */

const https = require('https');
const http = require('http');

// Disable SSL certificate verification for local development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'https://localhost:3001';
const API_BASE = '/make-server-6d46752d';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false, // Accept self-signed certificates
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testEndpoint(name, method, path, body = null) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Testing: ${name}`, 'blue');
  log(`${method} ${path}`, 'yellow');
  log('='.repeat(60), 'cyan');

  try {
    const response = await makeRequest(method, path, body);
    
    if (response.status >= 200 && response.status < 300) {
      log(`✅ Status: ${response.status}`, 'green');
      if (response.body.success) {
        log(`✅ Success: true`, 'green');
        if (response.body.auth_url) {
          log(`✅ Auth URL generated`, 'green');
          log(`   URL: ${response.body.auth_url.substring(0, 80)}...`, 'yellow');
        }
        if (response.body.access_token) {
          log(`✅ Access token received (length: ${response.body.access_token.length})`, 'green');
        }
      } else {
        log(`⚠️  Success: false`, 'yellow');
      }
      
      // Show relevant response data
      if (response.body.error) {
        log(`❌ Error: ${response.body.error}`, 'red');
      }
      if (response.body.hint) {
        log(`💡 Hint: ${response.body.hint}`, 'yellow');
      }
      
      return { success: true, response };
    } else {
      log(`❌ Status: ${response.status}`, 'red');
      if (response.body.error) {
        log(`❌ Error: ${response.body.error}`, 'red');
      }
      if (response.body.hint) {
        log(`💡 Hint: ${response.body.hint}`, 'yellow');
      }
      return { success: false, response };
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
    if (error.code === 'ECONNREFUSED') {
      log(`💡 Server might not be running. Try: cd QRATE && npm run server`, 'yellow');
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🎵 Spotify OAuth Endpoint Tests for QRATE', 'cyan');
  log('='.repeat(60), 'cyan');

  // Test 1: Guest Spotify Auth
  await testEndpoint(
    'Guest Spotify Authentication',
    'GET',
    `${API_BASE}/spotify/auth`
  );

  // Test 2: DJ Spotify Auth
  await testEndpoint(
    'DJ Spotify Authentication',
    'GET',
    `${API_BASE}/spotify/dj/auth`
  );

  // Test 3: Guest Callback (will fail without valid code, but tests endpoint)
  await testEndpoint(
    'Guest Spotify Callback (test with invalid code)',
    'POST',
    `${API_BASE}/spotify/callback`,
    { code: 'test_invalid_code_12345' }
  );

  // Test 4: DJ Callback (will fail without valid code, but tests endpoint)
  await testEndpoint(
    'DJ Spotify Callback (test with invalid code)',
    'POST',
    `${API_BASE}/spotify/dj/callback`,
    { code: 'test_invalid_code_12345' }
  );

  // Test 5: Health check
  await testEndpoint(
    'Health Check',
    'GET',
    `${API_BASE}/health`
  );

  log('\n' + '='.repeat(60), 'cyan');
  log('✅ Tests completed!', 'green');
  log('\n💡 Notes:', 'yellow');
  log('   - Auth endpoints should return auth_url if SPOTIFY_CLIENT_ID is set', 'yellow');
  log('   - Callback endpoints will fail with invalid codes (this is expected)', 'yellow');
  log('   - Check server logs for redirect URI information', 'yellow');
  log('   - Make sure redirect URIs match in Spotify Dashboard', 'yellow');
  log('='.repeat(60) + '\n', 'cyan');
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});



