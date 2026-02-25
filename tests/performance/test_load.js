/**
 * k6 Load Testing Script for ClaudeTrader Pro
 * 
 * Tests system performance under load:
 * - API Gateway endpoints
 * - Claude Engine prediction API
 * - Concurrent users simulation
 * - Response time analysis
 * 
 * Run with: k6 run test_load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const predictionDuration = new Trend('prediction_duration');
const marketDataDuration = new Trend('market_data_duration');
const requestCounter = new Counter('requests_total');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 50 },    // Stay at 50 users for 2 minutes
    { duration: '30s', target: 100 },  // Spike to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  
  thresholds: {
    // HTTP errors should be less than 1%
    'http_req_failed': ['rate<0.01'],
    
    // 95% of requests should complete under 2 seconds
    'http_req_duration': ['p(95)<2000'],
    
    // 99% of requests should complete under 5 seconds
    'http_req_duration': ['p(99)<5000'],
    
    // Custom thresholds
    'errors': ['rate<0.01'],
    'prediction_duration': ['p(95)<10000'], // Predictions can take longer
  },
};

// Test URLs
const API_GATEWAY_URL = __ENV.API_GATEWAY_URL || 'http://localhost:8100';
const CLAUDE_ENGINE_URL = __ENV.CLAUDE_ENGINE_URL || 'http://localhost:8108';

export default function () {
  // Test 1: Health check (lightweight)
  testHealthCheck();
  
  // Test 2: Market data endpoint
  testMarketData();
  
  // Test 3: Predictions list (read-heavy)
  testPredictionsList();
  
  // Test 4: Create prediction (write-heavy, slower)
  // Only run for 20% of iterations to avoid overwhelming Claude API
  if (Math.random() < 0.2) {
    testCreatePrediction();
  }
  
  // Sleep between iterations
  sleep(1);
}

function testHealthCheck() {
  const responses = http.batch([
    ['GET', `${API_GATEWAY_URL}/health`],
    ['GET', `${CLAUDE_ENGINE_URL}/health`],
  ]);
  
  responses.forEach(response => {
    requestCounter.add(1);
    
    const success = check(response, {
      'health check status 200': (r) => r.status === 200,
      'health check duration < 1s': (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(!success);
  });
}

function testMarketData() {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  
  const startTime = new Date();
  const response = http.get(`${API_GATEWAY_URL}/api/market/${symbol.replace('/', '/')}`);
  const duration = new Date() - startTime;
  
  requestCounter.add(1);
  marketDataDuration.add(duration);
  
  const success = check(response, {
    'market data status 200': (r) => r.status === 200,
    'market data has price': (r) => {
      if (r.status !== 200) return false;
      try {
        const data = JSON.parse(r.body);
        return data.data && data.data.market && typeof data.data.market.price === 'number';
      } catch (e) {
        return false;
      }
    },
    'market data duration < 5s': (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!success);
}

function testPredictionsList() {
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.get(`${API_GATEWAY_URL}/api/predictions?limit=10`, params);
  requestCounter.add(1);
  
  const success = check(response, {
    'predictions list status 200': (r) => r.status === 200,
    'predictions list is array': (r) => {
      if (r.status !== 200) return false;
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data.data);
      } catch (e) {
        return false;
      }
    },
    'predictions list duration < 3s': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
}

function testCreatePrediction() {
  const symbols = ['BTC/USDT', 'ETH/USDT'];
  const strategies = ['conservative', 'aggressive'];
  
  const payload = JSON.stringify({
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    strategy: strategies[Math.floor(Math.random() * strategies.length)],
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const startTime = new Date();
  const response = http.post(`${API_GATEWAY_URL}/api/predictions`, payload, params);
  const duration = new Date() - startTime;
  
  requestCounter.add(1);
  predictionDuration.add(duration);
  
  const success = check(response, {
    'create prediction status 201 or 200': (r) => [200, 201].includes(r.status),
    'create prediction has id': (r) => {
      if (![200, 201].includes(r.status)) return false;
      try {
        const data = JSON.parse(r.body);
        return data.data && data.data.id;
      } catch (e) {
        return false;
      }
    },
    'create prediction duration < 15s': (r) => r.timings.duration < 15000,
  });
  
  errorRate.add(!success);
}

// Setup function (runs once before load test)
export function setup() {
  console.log('Starting ClaudeTrader Pro load test...');
  console.log(`API Gateway: ${API_GATEWAY_URL}`);
  console.log(`Claude Engine: ${CLAUDE_ENGINE_URL}`);
  
  // Verify services are up
  const healthCheck = http.get(`${API_GATEWAY_URL}/health`);
  if (healthCheck.status !== 200) {
    console.error('API Gateway health check failed!');
  }
}

// Teardown function (runs once after load test)
export function teardown(data) {
  console.log('Load test completed!');
}
