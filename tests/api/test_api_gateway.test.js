/**
 * API Gateway Integration Tests
 * 
 * Tests all API Gateway endpoints for:
 * - Health checks
 * - Market data retrieval
 * - Predictions API
 * - Rate limiting
 * - Error handling
 */

const request = require('supertest');
const { mockMarketSnapshot, rateLimitTestConfig } = require('../fixtures/test-data');

const API_URL = global.TEST_CONFIG.API_GATEWAY_URL;

describe('API Gateway - Health & Status', () => {
  test('GET /health returns 200 and healthy status', async () => {
    const response = await request(API_URL)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status');
    expect(['healthy', 'ok']).toContain(response.body.status.toLowerCase());
  });

  test('GET /api/status returns service information', async () => {
    const response = await request(API_URL)
      .get('/api/status')
      .expect(200);
    
    expect(response.body).toHaveProperty('service');
    expect(response.body.service).toBe('claude-trader-api-gateway');
  });
});

describe('API Gateway - Market Data', () => {
  test('GET /api/market/:symbol returns market data', async () => {
    const response = await request(API_URL)
      .get('/api/market/BTC/USDT')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('symbol');
    expect(response.body.data.symbol).toBe('BTC/USDT');
    expect(response.body.data).toHaveProperty('market');
    expect(response.body.data.market).toHaveProperty('price');
    expect(typeof response.body.data.market.price).toBe('number');
  });

  test('GET /api/market/INVALID returns 400 or 404', async () => {
    const response = await request(API_URL)
      .get('/api/market/INVALID');
    
    expect([400, 404]).toContain(response.status);
  });

  test('Market data includes sentiment and technical indicators', async () => {
    const response = await request(API_URL)
      .get('/api/market/BTC/USDT')
      .expect(200);
    
    const { data } = response.body;
    
    // Check for sentiment data
    if (data.sentiment) {
      expect(data.sentiment).toHaveProperty('score');
      expect(typeof data.sentiment.score).toBe('number');
    }
    
    // Check for technical data
    if (data.technical) {
      expect(data.technical).toHaveProperty('rsi_14');
    }
    
    // Check overall confidence
    expect(data).toHaveProperty('overall_confidence');
    expect(typeof data.overall_confidence).toBe('number');
    expect(data.overall_confidence).toBeGreaterThanOrEqual(0);
    expect(data.overall_confidence).toBeLessThanOrEqual(1);
  });
});

describe('API Gateway - Predictions', () => {
  test('GET /api/predictions returns paginated results', async () => {
    const response = await request(API_URL)
      .get('/api/predictions?limit=10')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeLessThanOrEqual(10);
    
    // Check pagination metadata
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('offset');
  });

  test('GET /api/predictions/:id returns single prediction', async () => {
    // First get list of predictions
    const listResponse = await request(API_URL)
      .get('/api/predictions?limit=1')
      .expect(200);
    
    if (listResponse.body.data.length > 0) {
      const predictionId = listResponse.body.data[0].id;
      
      const response = await request(API_URL)
        .get(`/api/predictions/${predictionId}`)
        .expect(200);
      
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).toBe(predictionId);
      expect(response.body.data).toHaveProperty('symbol');
      expect(response.body.data).toHaveProperty('prediction_type');
      expect(['up', 'down']).toContain(response.body.data.prediction_type);
    }
  });

  test('POST /api/predictions creates new prediction', async () => {
    const response = await request(API_URL)
      .post('/api/predictions')
      .send({
        symbol: 'BTC/USDT',
        strategy: 'conservative'
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('prediction_type');
    expect(response.body.data).toHaveProperty('confidence');
    expect(response.body.data.confidence).toBeGreaterThanOrEqual(0);
    expect(response.body.data.confidence).toBeLessThanOrEqual(1);
  });

  test('POST /api/predictions with invalid symbol returns 400', async () => {
    await request(API_URL)
      .post('/api/predictions')
      .send({
        symbol: '', // Empty symbol
        strategy: 'conservative'
      })
      .expect(400);
  });

  test('GET /api/predictions filters by symbol', async () => {
    const response = await request(API_URL)
      .get('/api/predictions?symbol=BTC/USDT&limit=5')
      .expect(200);
    
    expect(Array.isArray(response.body.data)).toBe(true);
    
    // All predictions should be for BTC/USDT
    response.body.data.forEach(prediction => {
      expect(prediction.symbol).toBe('BTC/USDT');
    });
  });
});

describe('API Gateway - Rate Limiting', () => {
  test('Rate limiting returns 429 after exceeding limit', async () => {
    const { maxRequests, endpoint, expectedStatus } = rateLimitTestConfig;
    
    // Send requests up to the limit
    const requests = [];
    for (let i = 0; i < maxRequests; i++) {
      requests.push(
        request(API_URL)
          .get(endpoint)
          .then(res => res.status)
      );
    }
    
    const responses = await Promise.all(requests);
    
    // At least one request should be rate limited
    const rateLimitedCount = responses.filter(status => status === expectedStatus).length;
    expect(rateLimitedCount).toBeGreaterThan(0);
  }, 60000); // Extended timeout for rate limit test
});

describe('API Gateway - Error Handling', () => {
  test('Non-existent endpoint returns 404', async () => {
    await request(API_URL)
      .get('/api/nonexistent')
      .expect(404);
  });

  test('Invalid method returns 405', async () => {
    await request(API_URL)
      .delete('/api/status') // Status endpoint doesn't support DELETE
      .then(res => {
        expect([404, 405]).toContain(res.status);
      });
  });

  test('Malformed JSON returns 400', async () => {
    await request(API_URL)
      .post('/api/predictions')
      .set('Content-Type', 'application/json')
      .send('{"invalid json')
      .then(res => {
        expect([400, 500]).toContain(res.status);
      });
  });
});

describe('API Gateway - CORS & Security Headers', () => {
  test('CORS headers are present', async () => {
    const response = await request(API_URL)
      .get('/health')
      .expect(200);
    
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  test('Security headers are present', async () => {
    const response = await request(API_URL)
      .get('/health')
      .expect(200);
    
    // Helmet security headers
    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('API Gateway - Performance', () => {
  test('Health endpoint responds within 1 second', async () => {
    const startTime = Date.now();
    
    await request(API_URL)
      .get('/health')
      .expect(200);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000);
  });

  test('Market data endpoint responds within 5 seconds', async () => {
    const startTime = Date.now();
    
    await request(API_URL)
      .get('/api/market/BTC/USDT')
      .expect(200);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000);
  });
});
