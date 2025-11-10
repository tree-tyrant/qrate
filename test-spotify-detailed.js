#!/usr/bin/env node
/**
 * Detailed test script for Spotify OAuth endpoints in QRATE
 * Shows redirect URIs and detailed error information
 */

const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'https://localhost:3001';
const API_BASE = '/make-server-6d46752d';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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
      rejectUnauthorized: false,
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

function parseAuthUrl(authUrl) {
  try {
    const url = new URL(authUrl);
    const params = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch (e) {
    return null;
  }
}

async function testDetailed() {
  log('\n🎵 Detailed Spotify OAuth Endpoint Tests for QRATE', 'cyan');
  log('='.repeat(70), 'cyan');

  // Test Guest Auth
  log('\n📋 TEST 1: Guest Spotify Authentication', 'blue');
  log('-'.repeat(70), 'blue');
  try {
    const response = await makeRequest('GET', `${API_BASE}/spotify/auth`);
    
    if (response.status === 200 && response.body.success && response.body.auth_url) {
      log('✅ Endpoint is working!', 'green');
      log(`\n📍 Auth URL:`, 'yellow');
      log(`   ${response.body.auth_url}`, 'cyan');
      
      const params = parseAuthUrl(response.body.auth_url);
      if (params) {
        log(`\n📊 URL Parameters:`, 'yellow');
        log(`   client_id: ${params.client_id ? params.client_id.substring(0, 20) + '...' : 'MISSING'}`, 'cyan');
        log(`   redirect_uri: ${decodeURIComponent(params.redirect_uri || 'MISSING')}`, 'cyan');
        log(`   scope: ${decodeURIComponent(params.scope || 'MISSING')}`, 'cyan');
        log(`   response_type: ${params.response_type || 'MISSING'}`, 'cyan');
        log(`   state: ${params.state || 'MISSING'}`, 'cyan');
        
        log(`\n⚠️  IMPORTANT: Add this redirect URI to Spotify Dashboard:`, 'yellow');
        log(`   ${decodeURIComponent(params.redirect_uri)}`, 'magenta');
      }
    } else {
      log('❌ Endpoint failed or not configured', 'red');
      if (response.body.error) {
        log(`   Error: ${response.body.error}`, 'red');
      }
      if (response.body.hint) {
        log(`   Hint: ${response.body.hint}`, 'yellow');
      }
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }

  // Test DJ Auth
  log('\n📋 TEST 2: DJ Spotify Authentication', 'blue');
  log('-'.repeat(70), 'blue');
  try {
    const response = await makeRequest('GET', `${API_BASE}/spotify/dj/auth`);
    
    if (response.status === 200 && response.body.success && response.body.auth_url) {
      log('✅ Endpoint is working!', 'green');
      log(`\n📍 Auth URL:`, 'yellow');
      log(`   ${response.body.auth_url}`, 'cyan');
      
      const params = parseAuthUrl(response.body.auth_url);
      if (params) {
        log(`\n📊 URL Parameters:`, 'yellow');
        log(`   client_id: ${params.client_id ? params.client_id.substring(0, 20) + '...' : 'MISSING'}`, 'cyan');
        log(`   redirect_uri: ${decodeURIComponent(params.redirect_uri || 'MISSING')}`, 'cyan');
        log(`   scope: ${decodeURIComponent(params.scope || 'MISSING')}`, 'cyan');
        log(`   response_type: ${params.response_type || 'MISSING'}`, 'cyan');
        log(`   state: ${params.state || 'MISSING'}`, 'cyan');
        
        log(`\n⚠️  IMPORTANT: Add this redirect URI to Spotify Dashboard:`, 'yellow');
        log(`   ${decodeURIComponent(params.redirect_uri)}`, 'magenta');
      }
    } else {
      log('❌ Endpoint failed or not configured', 'red');
      if (response.body.error) {
        log(`   Error: ${response.body.error}`, 'red');
      }
      if (response.body.hint) {
        log(`   Hint: ${response.body.hint}`, 'yellow');
      }
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }

  // Test Callback with invalid code (to see error details)
  log('\n📋 TEST 3: Guest Callback Error Details', 'blue');
  log('-'.repeat(70), 'blue');
  try {
    const response = await makeRequest('POST', `${API_BASE}/spotify/callback`, {
      code: 'invalid_test_code_12345'
    });
    
    log(`Status: ${response.status}`, response.status === 400 ? 'yellow' : 'red');
    if (response.body.error) {
      log(`Error: ${response.body.error}`, 'red');
    }
    if (response.body.details) {
      log(`Details: ${response.body.details}`, 'yellow');
    }
    log('(This error is expected with an invalid code)', 'yellow');
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }

  // Test DJ Callback with invalid code
  log('\n📋 TEST 4: DJ Callback Error Details', 'blue');
  log('-'.repeat(70), 'blue');
  try {
    const response = await makeRequest('POST', `${API_BASE}/spotify/dj/callback`, {
      code: 'invalid_test_code_12345'
    });
    
    log(`Status: ${response.status}`, response.status === 400 ? 'yellow' : 'red');
    if (response.body.error) {
      log(`Error: ${response.body.error}`, 'red');
    }
    if (response.body.details) {
      log(`Details: ${response.body.details}`, 'yellow');
    }
    log('(This error is expected with an invalid code)', 'yellow');
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }

  log('\n' + '='.repeat(70), 'cyan');
  log('📝 SUMMARY', 'cyan');
  log('='.repeat(70), 'cyan');
  log('✅ Auth endpoints: Working if they return auth_url', 'green');
  log('✅ Callback endpoints: Working if they return 400 for invalid codes', 'green');
  log('⚠️  Make sure redirect URIs match exactly in Spotify Dashboard', 'yellow');
  log('⚠️  Check server logs for exact redirect URIs being used', 'yellow');
  log('='.repeat(70) + '\n', 'cyan');
}

testDetailed().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});



