/**
 * Test Fixtures and Mock Data for ClaudeTrader Pro Tests
 */

// Mock market snapshots
const mockMarketSnapshot = {
  symbol: 'BTC/USDT',
  market: {
    price: 43250.50,
    price_change_24h: 2.5,
    volume_24h: 28500000000,
    sources: ['binance', 'coinbase', 'kraken']
  },
  sentiment: {
    score: 65,
    fear_greed_index: 55,
    trend: 'bullish'
  },
  technical: {
    rsi_14: 58.5,
    macd_trend: 'bullish',
    moving_average_20: 42800,
    moving_average_50: 41500
  },
  overall_confidence: 0.85,
  timestamp: new Date().toISOString()
};

// Mock prediction response
const mockPrediction = {
  symbol: 'BTC/USDT',
  prediction_type: 'up',
  confidence: 0.75,
  reasoning: 'Based on positive sentiment and bullish technical indicators, expecting upward movement.',
  market_context: mockMarketSnapshot,
  claude_model: 'claude-sonnet-4-20250514',
  prompt_version: '1.0',
  input_tokens: 1250,
  output_tokens: 150,
  cached_tokens: 0,
  total_cost_usd: 0.006,
  api_latency_ms: 850
};

// Mock WebSocket messages
const mockWebSocketMessages = {
  marketUpdate: {
    event: 'market_update',
    data: {
      symbol: 'BTC/USDT',
      price: 43275.25,
      change_24h: 2.6,
      timestamp: Date.now()
    }
  },
  
  predictionUpdate: {
    event: 'prediction_update',
    data: {
      id: 1,
      symbol: 'BTC/USDT',
      prediction_type: 'up',
      confidence: 0.75,
      timestamp: Date.now()
    }
  },
  
  subscribed: {
    event: 'subscribed',
    data: {
      symbol: 'BTC/USDT',
      message: 'Successfully subscribed to BTC/USDT updates'
    }
  }
};

// Database test records
const dbTestPrediction = {
  symbol: 'BTC/USDT',
  prediction_type: 'up',
  confidence: 0.75,
  reasoning: 'Test prediction for E2E testing',
  market_context: mockMarketSnapshot,
  claude_model: 'claude-sonnet-4-20250514',
  prompt_version: '1.0'
};

const dbTestCostRecord = {
  input_tokens: 1250,
  output_tokens: 150,
  cached_tokens: 0,
  total_cost_usd: 0.006,
  api_latency_ms: 850
};

const dbTestAccuracyMetric = {
  actual_movement: 'up',
  actual_change_pct: 1.5,
  time_horizon_hours: 1,
  was_correct: true
};

// Invalid data for error testing
const invalidData = {
  prediction: {
    symbol: '', // Empty symbol
    prediction_type: 'invalid', // Invalid type
    confidence: 1.5 // Out of range
  },
  
  marketData: {
    symbol: 'INVALID/PAIR',
    invalid_field: true
  }
};

// Rate limiting test data
const rateLimitTestConfig = {
  maxRequests: 101, // Exceeds limit of 100
  endpoint: '/api/status',
  expectedStatus: 429
};

module.exports = {
  mockMarketSnapshot,
  mockPrediction,
  mockWebSocketMessages,
  dbTestPrediction,
  dbTestCostRecord,
  dbTestAccuracyMetric,
  invalidData,
  rateLimitTestConfig
};
