/**
 * Global Test Setup for ClaudeTrader Pro E2E Tests
 * 
 * Configures test environment, timeouts, and global utilities
 */

// Extend Jest timeout for integration tests
jest.setTimeout(30000);

// Global test configuration
global.TEST_CONFIG = {
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:8100',
  CLAUDE_ENGINE_URL: process.env.CLAUDE_ENGINE_URL || 'http://localhost:8108',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://claude-trader.herakles.dev',
  WS_URL: process.env.WS_URL || 'http://localhost:8100',
  
  DATABASE: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'hercules_db',
    user: process.env.DB_USER || 'hercules',
    password: process.env.DB_PASSWORD || 'your-password-here',
    schema: 'trading_predictions'
  },
  
  TIMEOUTS: {
    API_CALL: 5000,
    WEBSOCKET_CONNECT: 10000,
    WEBSOCKET_MESSAGE: 35000, // 30s broadcast interval + 5s buffer
    DATABASE_QUERY: 3000,
    FRONTEND_LOAD: 5000
  },
  
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000
  }
};

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.retryAsync = async (fn, maxRetries = 3, delayMs = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delayMs);
    }
  }
};

// Console output control for cleaner test logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

if (process.env.VERBOSE_TESTS !== 'true') {
  console.log = (...args) => {
    if (args[0]?.includes?.('[TEST]')) {
      originalConsoleLog(...args);
    }
  };
  
  console.error = (...args) => {
    if (!args[0]?.includes?.('DeprecationWarning')) {
      originalConsoleError(...args);
    }
  };
}

// Test data cleanup helpers
afterAll(async () => {
  // Cleanup logic if needed
  await sleep(500); // Allow async operations to complete
});
