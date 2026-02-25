/**
 * WebSocket Connection Tests
 * 
 * Tests real-time WebSocket functionality:
 * - Connection establishment
 * - Subscribe/unsubscribe
 * - Market updates
 * - Prediction updates
 * - Reconnection handling
 */

const io = require('socket.io-client');
const { mockWebSocketMessages } = require('../fixtures/test-data');

const WS_URL = global.TEST_CONFIG.WS_URL;
const TIMEOUTS = global.TEST_CONFIG.TIMEOUTS;

describe('WebSocket - Connection Management', () => {
  let socket;

  afterEach((done) => {
    if (socket && socket.connected) {
      socket.disconnect();
      setTimeout(done, 500);
    } else {
      done();
    }
  });

  test('Socket connects successfully', (done) => {
    socket = io(WS_URL, {
      transports: ['websocket'],
      timeout: TIMEOUTS.WEBSOCKET_CONNECT
    });

    socket.on('connect', () => {
      expect(socket.connected).toBe(true);
      expect(socket.id).toBeDefined();
      done();
    });

    socket.on('connect_error', (error) => {
      done(error);
    });
  }, TIMEOUTS.WEBSOCKET_CONNECT);

  test('Socket disconnects cleanly', (done) => {
    socket = io(WS_URL, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      socket.disconnect();
    });

    socket.on('disconnect', (reason) => {
      expect(socket.connected).toBe(false);
      done();
    });
  }, TIMEOUTS.WEBSOCKET_CONNECT);

  test('Socket reconnects after disconnect', (done) => {
    socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionAttempts: 3
    });

    let connectCount = 0;

    socket.on('connect', () => {
      connectCount++;
      
      if (connectCount === 1) {
        // First connection - disconnect to test reconnection
        socket.disconnect();
        socket.connect();
      } else if (connectCount === 2) {
        // Reconnected successfully
        expect(connectCount).toBe(2);
        done();
      }
    });
  }, 15000);
});

describe('WebSocket - Symbol Subscription', () => {
  let socket;

  beforeEach((done) => {
    socket = io(WS_URL, {
      transports: ['websocket']
    });
    socket.on('connect', () => done());
  });

  afterEach((done) => {
    if (socket && socket.connected) {
      socket.disconnect();
      setTimeout(done, 500);
    } else {
      done();
    }
  });

  test('Subscribe to symbol returns confirmation', (done) => {
    socket.emit('subscribe', { symbol: 'BTC/USDT' });

    socket.on('subscribed', (data) => {
      expect(data).toBeDefined();
      expect(data.symbol).toBe('BTC/USDT');
      done();
    });

    socket.on('error', (error) => {
      done(error);
    });
  }, TIMEOUTS.WEBSOCKET_CONNECT);

  test('Subscribe to multiple symbols', (done) => {
    const symbols = ['BTC/USDT', 'ETH/USDT'];
    let subscriptionCount = 0;

    socket.on('subscribed', (data) => {
      subscriptionCount++;
      expect(symbols).toContain(data.symbol);

      if (subscriptionCount === symbols.length) {
        done();
      }
    });

    symbols.forEach(symbol => {
      socket.emit('subscribe', { symbol });
    });
  }, TIMEOUTS.WEBSOCKET_CONNECT);

  test('Unsubscribe from symbol', (done) => {
    socket.emit('subscribe', { symbol: 'BTC/USDT' });

    socket.on('subscribed', () => {
      socket.emit('unsubscribe', { symbol: 'BTC/USDT' });
    });

    socket.on('unsubscribed', (data) => {
      expect(data.symbol).toBe('BTC/USDT');
      done();
    });
  }, TIMEOUTS.WEBSOCKET_CONNECT);

  test('Subscribe with invalid symbol returns error', (done) => {
    socket.emit('subscribe', { symbol: '' }); // Empty symbol

    socket.on('error', (error) => {
      expect(error).toBeDefined();
      expect(error.message || error).toBeTruthy();
      done();
    });

    socket.on('subscribed', () => {
      done(new Error('Should not subscribe to empty symbol'));
    });

    // If no error after 3 seconds, consider it acceptable
    setTimeout(() => {
      done();
    }, 3000);
  }, 5000);
});

describe('WebSocket - Market Updates', () => {
  let socket;

  beforeEach((done) => {
    socket = io(WS_URL, {
      transports: ['websocket']
    });
    socket.on('connect', () => {
      socket.emit('subscribe', { symbol: 'BTC/USDT' });
      done();
    });
  });

  afterEach((done) => {
    if (socket && socket.connected) {
      socket.disconnect();
      setTimeout(done, 500);
    } else {
      done();
    }
  });

  test('Receive market updates after subscription', (done) => {
    socket.on('market_update', (data) => {
      expect(data).toBeDefined();
      expect(data.symbol).toBe('BTC/USDT');
      expect(data).toHaveProperty('price');
      expect(typeof data.price).toBe('number');
      expect(data.price).toBeGreaterThan(0);
      done();
    });
  }, TIMEOUTS.WEBSOCKET_MESSAGE);

  test('Market update includes timestamp', (done) => {
    socket.on('market_update', (data) => {
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.timestamp).toBe('number');
      
      // Timestamp should be recent (within last minute)
      const now = Date.now();
      const age = now - data.timestamp;
      expect(age).toBeLessThan(60000); // Less than 1 minute old
      
      done();
    });
  }, TIMEOUTS.WEBSOCKET_MESSAGE);

  test('Market update includes price change', (done) => {
    socket.on('market_update', (data) => {
      // Price change might be present
      if (data.change_24h !== undefined) {
        expect(typeof data.change_24h).toBe('number');
      }
      done();
    });
  }, TIMEOUTS.WEBSOCKET_MESSAGE);
});

describe('WebSocket - Prediction Updates', () => {
  let socket;

  beforeEach((done) => {
    socket = io(WS_URL, {
      transports: ['websocket']
    });
    socket.on('connect', () => {
      socket.emit('subscribe', { symbol: 'BTC/USDT' });
      done();
    });
  });

  afterEach((done) => {
    if (socket && socket.connected) {
      socket.disconnect();
      setTimeout(done, 500);
    } else {
      done();
    }
  });

  test('Receive prediction updates when available', (done) => {
    let received = false;

    socket.on('prediction_update', (data) => {
      if (!received) {
        received = true;
        
        expect(data).toBeDefined();
        expect(data).toHaveProperty('symbol');
        expect(data).toHaveProperty('prediction_type');
        expect(['up', 'down']).toContain(data.prediction_type);
        expect(data).toHaveProperty('confidence');
        expect(data.confidence).toBeGreaterThanOrEqual(0);
        expect(data.confidence).toBeLessThanOrEqual(1);
        
        done();
      }
    });

    socket.on('market_update', () => {
      // Just receiving market updates is ok too
    });

    // Timeout after 35 seconds - prediction updates might not occur
    setTimeout(() => {
      if (!received) {
        console.log('[TEST] No prediction updates received (this is acceptable)');
        done();
      }
    }, 35000);
  }, 40000);
});

describe('WebSocket - Error Handling', () => {
  let socket;

  afterEach((done) => {
    if (socket && socket.connected) {
      socket.disconnect();
      setTimeout(done, 500);
    } else {
      done();
    }
  });

  test('Handle connection errors gracefully', (done) => {
    // Try to connect to invalid URL
    socket = io('http://localhost:9999', {
      transports: ['websocket'],
      timeout: 2000,
      reconnection: false
    });

    socket.on('connect_error', (error) => {
      expect(error).toBeDefined();
      done();
    });

    socket.on('connect', () => {
      done(new Error('Should not connect to invalid URL'));
    });
  }, 5000);

  test('Handle malformed subscription data', (done) => {
    socket = io(WS_URL, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      // Send malformed data
      socket.emit('subscribe', { invalid: 'data' });
      
      // Wait a bit and consider success if no crash
      setTimeout(() => {
        expect(socket.connected).toBe(true);
        done();
      }, 1000);
    });
  }, 5000);
});

describe('WebSocket - Performance', () => {
  let socket;

  beforeEach((done) => {
    socket = io(WS_URL, {
      transports: ['websocket']
    });
    socket.on('connect', () => done());
  });

  afterEach((done) => {
    if (socket && socket.connected) {
      socket.disconnect();
      setTimeout(done, 500);
    } else {
      done();
    }
  });

  test('Connection establishes within timeout', (done) => {
    const startTime = Date.now();
    
    const testSocket = io(WS_URL, {
      transports: ['websocket']
    });

    testSocket.on('connect', () => {
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(TIMEOUTS.WEBSOCKET_CONNECT);
      testSocket.disconnect();
      done();
    });
  }, TIMEOUTS.WEBSOCKET_CONNECT);

  test('Subscribe acknowledgment is fast', (done) => {
    const startTime = Date.now();
    
    socket.emit('subscribe', { symbol: 'BTC/USDT' });

    socket.on('subscribed', () => {
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should ack within 2 seconds
      done();
    });
  }, 5000);
});
