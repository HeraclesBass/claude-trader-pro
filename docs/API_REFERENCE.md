# ClaudeTrader Pro - API Reference

**Base URL:** `https://trade.herakles.dev/api`
**Authentication:** Authelia SSO (session-based)

All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-01-17T12:00:00.000Z",
  "message": "Optional message"
}
```

---

## Health & Status

### GET /health
System health check with component status.

**Request:**
```bash
curl https://trade.herakles.dev/api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "claude-trader-api-gateway",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 86400.123,
    "database": "connected",
    "claudeEngine": "available",
    "websocket": {
      "connections": 3,
      "subscriptions": 5
    }
  }
}
```

### GET /status
Detailed system status with memory and connection info.

**Request:**
```bash
curl https://trade.herakles.dev/api/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gateway": {
      "version": "1.0.0",
      "uptime": 86400.123,
      "memory": {
        "rss": 52428800,
        "heapUsed": 25165824
      },
      "environment": "production"
    },
    "claudeEngine": {
      "status": "available",
      "lastCheck": "2026-01-17T12:00:00.000Z"
    },
    "websocket": {
      "connections": 3
    },
    "database": {
      "host": "claude-trader-postgres",
      "port": 5432,
      "maxConnections": 10
    }
  }
}
```

---

## Market Data

### GET /market/cached
Get all cached market data for supported cryptocurrencies.

**Request:**
```bash
curl https://trade.herakles.dev/api/market/cached
```

**Response:**
```json
{
  "success": true,
  "data": {
    "symbols": ["BTC", "ETH", "SOL", "BNB", "XRP"],
    "count": 5,
    "data": {
      "BTC": {
        "symbol": "BTC",
        "current_price": 95680.42,
        "price_change_24h": 1250.30,
        "price_change_percentage_24h": 1.32,
        "high_24h": 96100.00,
        "low_24h": 94200.00,
        "total_volume": 28500000000,
        "market_cap": 1890000000000,
        "last_updated": "2026-01-17T12:00:00.000Z",
        "source": "coingecko"
      },
      "ETH": {
        "symbol": "ETH",
        "current_price": 3245.67,
        "price_change_24h": -45.20,
        "price_change_percentage_24h": -1.37,
        "high_24h": 3300.00,
        "low_24h": 3200.00,
        "total_volume": 15200000000,
        "market_cap": 390000000000,
        "last_updated": "2026-01-17T12:00:00.000Z",
        "source": "coingecko"
      }
    }
  },
  "message": "Cached market data retrieved"
}
```

---

## Sentiment

### GET /sentiment/fear-greed
Get the Fear & Greed Index from Alternative.me.

**Request:**
```bash
curl https://trade.herakles.dev/api/sentiment/fear-greed
```

**Response:**
```json
{
  "success": true,
  "data": {
    "value": 49,
    "classification": "Neutral",
    "timestamp": "2026-01-17T00:00:00.000Z",
    "source": "alternative.me"
  },
  "message": "Fear & Greed Index retrieved"
}
```

### GET /sentiment/market
Get comprehensive market sentiment with 7-day trend.

**Request:**
```bash
curl https://trade.herakles.dev/api/sentiment/market
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fear_greed": {
      "value": 49,
      "classification": "Neutral",
      "timestamp": "2026-01-17T00:00:00.000Z"
    },
    "trend": {
      "direction": "stable",
      "change_7d": -3,
      "history": [
        {"date": "2026-01-10", "value": 52},
        {"date": "2026-01-11", "value": 51},
        {"date": "2026-01-12", "value": 50},
        {"date": "2026-01-13", "value": 48},
        {"date": "2026-01-14", "value": 47},
        {"date": "2026-01-15", "value": 48},
        {"date": "2026-01-16", "value": 49}
      ]
    },
    "source": "alternative.me"
  },
  "message": "Market sentiment retrieved"
}
```

---

## Signals (OctoBot)

### GET /signals/health
Check OctoBot signal service status.

**Request:**
```bash
curl https://trade.herakles.dev/api/signals/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "octobot_connected": true,
    "last_signal_time": "2026-01-17T11:45:00.000Z",
    "signal_count_24h": 24,
    "active_symbols": ["BTC/USDT", "ETH/USDT"]
  },
  "message": "Signal health retrieved"
}
```

### GET /signals/latest
Get the latest trading signal for a symbol.

**Request:**
```bash
curl "https://trade.herakles.dev/api/signals/latest?symbol=BTC/USDT"
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| symbol | string | BTC/USDT | Trading pair |

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "BTC/USDT",
    "signal": "buy",
    "strength": 0.75,
    "indicators": {
      "rsi": 42.5,
      "macd": "bullish",
      "ema_trend": "up"
    },
    "timestamp": "2026-01-17T11:45:00.000Z"
  },
  "message": "Latest signal retrieved"
}
```

---

## Trades (Paper Trading)

### GET /trades/statistics
Get trade performance statistics.

**Request:**
```bash
curl "https://trade.herakles.dev/api/trades/statistics?days=30"
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| symbol | string | all | Filter by trading pair |
| days | integer | 30 | Time range in days |

**Response:**
```json
{
  "success": true,
  "data": {
    "total_trades": 50,
    "open_trades": 19,
    "closed_trades": 31,
    "win_rate": 64.52,
    "total_pnl": 79.62,
    "avg_pnl_per_trade": 2.57,
    "best_trade": 15.30,
    "worst_trade": -8.45,
    "avg_hold_time_hours": 4.2
  },
  "message": "Trade statistics retrieved"
}
```

### GET /trades/recent
Get recent trade history.

**Request:**
```bash
curl "https://trade.herakles.dev/api/trades/recent?limit=10&status=closed"
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| symbol | string | all | Filter by trading pair |
| limit | integer | 20 | Max results |
| status | string | all | Filter: open, closed, all |

**Response:**
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": "uuid-123",
        "symbol": "BTC/USDT",
        "action": "buy",
        "entry_price": 95000.00,
        "exit_price": 95500.00,
        "quantity": 0.01,
        "pnl": 5.00,
        "pnl_percent": 0.53,
        "status": "closed",
        "executed_at": "2026-01-17T08:00:00.000Z",
        "closed_at": "2026-01-17T12:00:00.000Z"
      }
    ],
    "total": 31,
    "limit": 10,
    "offset": 0
  },
  "message": "Recent trades retrieved"
}
```

---

## Predictions

### GET /predictions
List predictions with pagination.

**Request:**
```bash
curl "https://trade.herakles.dev/api/predictions?limit=10&symbol=BTC"
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| symbol | string | all | Filter by symbol |
| limit | integer | 20 | Max results |
| offset | integer | 0 | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "id": "uuid-456",
        "symbol": "BTC",
        "prediction_type": "up",
        "confidence": 0.72,
        "entry_price": 95000.00,
        "target_price": 96500.00,
        "time_horizon_hours": 4,
        "created_at": "2026-01-17T08:00:00.000Z",
        "was_correct": true,
        "actual_outcome": "up"
      }
    ],
    "total": 150,
    "limit": 10,
    "offset": 0
  },
  "message": "Predictions retrieved successfully"
}
```

### GET /predictions/latest
Get the most recent prediction.

**Request:**
```bash
curl "https://trade.herakles.dev/api/predictions/latest?symbol=BTC"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-789",
    "symbol": "BTC",
    "prediction_type": "up",
    "confidence": 0.68,
    "entry_price": 95680.00,
    "target_price": 97000.00,
    "time_horizon_hours": 4,
    "reasoning": "Strong RSI support, MACD bullish crossover...",
    "created_at": "2026-01-17T12:00:00.000Z"
  },
  "message": "Latest prediction retrieved successfully"
}
```

### POST /predict/:symbol
Trigger a new prediction for a symbol.

**Request:**
```bash
curl -X POST "https://trade.herakles.dev/api/predict/BTC" \
  -H "Content-Type: application/json" \
  -d '{"time_horizon_hours": 4}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-new",
    "symbol": "BTC",
    "prediction_type": "up",
    "confidence": 0.71,
    "entry_price": 95700.00,
    "target_price": 97200.00,
    "reasoning": "Technical analysis suggests bullish momentum...",
    "created_at": "2026-01-17T12:05:00.000Z"
  },
  "message": "Prediction generated for BTC"
}
```

---

## Automated Predictions

### GET /automated/cycle/current
Get the current 4-hour prediction cycle.

**Request:**
```bash
curl https://trade.herakles.dev/api/automated/cycle/current
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cycle_id": "2026-01-17-12",
    "started_at": "2026-01-17T12:00:00.000Z",
    "ends_at": "2026-01-17T16:00:00.000Z",
    "predictions_count": 5,
    "symbols": ["BTC", "ETH", "SOL", "BNB", "XRP"],
    "status": "active"
  },
  "message": "Current cycle retrieved successfully"
}
```

### GET /automated/decision/latest
Get the latest trading decision from the 4-hour cycle.

**Request:**
```bash
curl https://trade.herakles.dev/api/automated/decision/latest
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decision_id": "uuid-decision",
    "symbol": "BTC",
    "action": "hold",
    "confidence": 0.45,
    "reasoning": "Mixed signals, awaiting confirmation...",
    "created_at": "2026-01-17T12:00:00.000Z"
  },
  "message": "Latest decision retrieved successfully"
}
```

### POST /automated/predict/now
Trigger a manual prediction cycle (rate limited).

**Request:**
```bash
curl -X POST https://trade.herakles.dev/api/automated/predict/now
```

**Response:**
```json
{
  "success": true,
  "data": {
    "triggered": true,
    "predictions": [
      {"symbol": "BTC", "prediction_type": "up", "confidence": 0.72},
      {"symbol": "ETH", "prediction_type": "down", "confidence": 0.58}
    ],
    "cost_usd": 0.0005
  },
  "message": "Manual prediction triggered successfully"
}
```

---

## Analytics

### GET /analytics/accuracy
Get prediction accuracy metrics.

**Request:**
```bash
curl "https://trade.herakles.dev/api/analytics/accuracy?symbol=BTC&time_horizon_hours=4"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_predictions": 150,
    "evaluated": 120,
    "correct": 78,
    "accuracy_percent": 65.0,
    "by_confidence": {
      "high_confidence": {"count": 45, "accuracy": 73.3},
      "medium_confidence": {"count": 50, "accuracy": 64.0},
      "low_confidence": {"count": 25, "accuracy": 52.0}
    }
  },
  "message": "Accuracy metrics retrieved successfully"
}
```

### GET /analytics/costs
Get Claude API cost tracking.

**Request:**
```bash
curl "https://trade.herakles.dev/api/analytics/costs?days=7"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cost_usd": 3.45,
    "predictions_count": 168,
    "avg_cost_per_prediction": 0.0205,
    "daily_breakdown": [
      {"date": "2026-01-11", "cost": 0.48, "predictions": 24},
      {"date": "2026-01-12", "cost": 0.52, "predictions": 26}
    ]
  },
  "message": "Cost analytics retrieved successfully"
}
```

### GET /analytics/distribution
Get prediction direction distribution.

**Request:**
```bash
curl https://trade.herakles.dev/api/analytics/distribution
```

**Response:**
```json
{
  "success": true,
  "data": {
    "directions": [
      {"name": "Up", "value": 85},
      {"name": "Down", "value": 65}
    ]
  },
  "message": "Distribution retrieved successfully"
}
```

### GET /analytics/daily-stats
Get daily prediction statistics.

**Request:**
```bash
curl "https://trade.herakles.dev/api/analytics/daily-stats?days=7"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-16",
      "predictions": 24,
      "evaluated": 20,
      "correct": 13,
      "accuracy": 65.0,
      "avg_confidence": "68.5",
      "up_count": 14,
      "down_count": 10,
      "cost": "0.0480"
    }
  ],
  "message": "Daily statistics retrieved successfully"
}
```

---

## OctoBot Integration

### POST /v1/signals/execute
Execute a trading signal via OctoBot.

**Request:**
```bash
curl -X POST "https://trade.herakles.dev/api/v1/signals/execute" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTC/USDT", "direction": "buy", "confidence": 0.72}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executed": true,
    "order_id": "uuid-order",
    "symbol": "BTC/USDT",
    "side": "buy",
    "quantity": 0.035,
    "price": 94500.00
  },
  "message": "Signal executed successfully"
}
```

### GET /v1/signals/octobot/health
Check OctoBot container health.

**Request:**
```bash
curl https://trade.herakles.dev/api/v1/signals/octobot/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "container": "octobot-claude-trader",
    "uptime": 86400
  }
}
```

### GET /v1/signals/octobot/portfolio
Get paper trading portfolio from synced trades.

**Request:**
```bash
curl https://trade.herakles.dev/api/v1/signals/octobot/portfolio
```

**Response:**
```json
{
  "success": true,
  "data": {
    "portfolio": {
      "starting_capital": 10000,
      "current_value": 10250,
      "total_pnl": 250,
      "pnl_percent": 2.5,
      "trade_count": 15
    },
    "total_value_usd": 10250
  }
}
```

### GET /v1/signals/octobot/orders
Get open orders from paper trading.

**Request:**
```bash
curl https://trade.herakles.dev/api/v1/signals/octobot/orders
```

### GET /v1/signals/octobot/orders/closed
Get closed orders with P&L.

**Request:**
```bash
curl https://trade.herakles.dev/api/v1/signals/octobot/orders/closed
```

### POST /v1/signals/octobot/sync
Trigger manual sync from OctoBot to PostgreSQL.

**Request:**
```bash
curl -X POST https://trade.herakles.dev/api/v1/signals/octobot/sync
```

---

## Backtesting

### GET /v1/backtest/summary
Get backtest summary with key metrics.

**Request:**
```bash
curl "https://trade.herakles.dev/api/v1/backtest/summary?days=30"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period_days": 30,
    "total_predictions": 150,
    "evaluated": 120,
    "accuracy": 65.0,
    "sharpe_ratio": 1.24,
    "total_pnl": 450.50,
    "win_rate": 64.2
  }
}
```

### GET /v1/backtest/accuracy
Get prediction accuracy by symbol.

**Request:**
```bash
curl https://trade.herakles.dev/api/v1/backtest/accuracy
```

**Response:**
```json
{
  "success": true,
  "data": {
    "by_symbol": {
      "BTC": {"total": 50, "correct": 35, "accuracy": 70.0},
      "ETH": {"total": 40, "correct": 24, "accuracy": 60.0}
    }
  }
}
```

### GET /v1/backtest/calibration
Get confidence calibration data.

**Request:**
```bash
curl https://trade.herakles.dev/api/v1/backtest/calibration
```

---

## Risk Management

### GET /trades/risk/ruin
Get Risk of Ruin from trading history.

**Request:**
```bash
curl https://trade.herakles.dev/api/trades/risk/ruin
```

**Response:**
```json
{
  "success": true,
  "data": {
    "risk_of_ruin": 0.05,
    "kelly_fraction": 0.12,
    "optimal_position_size": 0.06,
    "max_drawdown": 15.5,
    "simulations": 1000
  }
}
```

### POST /trades/risk/ruin-calculator
Monte Carlo Risk of Ruin calculation.

**Request:**
```bash
curl -X POST "https://trade.herakles.dev/api/trades/risk/ruin-calculator" \
  -H "Content-Type: application/json" \
  -d '{"win_rate": 0.65, "avg_win": 100, "avg_loss": 80, "starting_capital": 10000}'
```

### GET /trades/risk/concentration
Get portfolio concentration risk analysis.

**Request:**
```bash
curl https://trade.herakles.dev/api/trades/risk/concentration
```

**Response:**
```json
{
  "success": true,
  "data": {
    "concentration_by_asset": {
      "BTC": 0.45,
      "ETH": 0.30,
      "SOL": 0.25
    },
    "concentration_by_group": {
      "BTC": 0.45,
      "ALT_L1": 0.55
    },
    "risk_level": "moderate"
  }
}
```

---

## WebSocket

### GET /websocket/stats
Get WebSocket connection statistics.

**Request:**
```bash
curl https://trade.herakles.dev/api/websocket/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "websocket": {
      "connections": 3,
      "rooms": ["market", "predictions"]
    },
    "connections": {
      "total": 3,
      "authenticated": 2
    },
    "marketData": {
      "isRunning": true,
      "symbolCount": 5,
      "lastFetch": "2026-01-17T12:00:00.000Z"
    }
  },
  "message": "WebSocket statistics retrieved"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "timestamp": "2026-01-17T12:00:00.000Z"
}
```

**Common Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| BAD_REQUEST | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Authentication required |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Predictions | 10 requests/minute |
| Market Data | 30 requests/minute |
| General | 100 requests/minute |

---

## WebSocket Events

Connect to `wss://trade.herakles.dev/socket.io/`

**Events:**

| Event | Direction | Description |
|-------|-----------|-------------|
| `market_update` | Server → Client | Real-time price updates |
| `prediction_new` | Server → Client | New prediction generated |
| `trade_update` | Server → Client | Trade status changed |
| `subscribe` | Client → Server | Subscribe to symbol updates |
| `unsubscribe` | Client → Server | Unsubscribe from updates |
