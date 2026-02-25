#!/usr/bin/env python3
"""
Claude Engine API Integration Tests

Tests FastAPI endpoints for:
- Health checks
- Prediction generation
- Cost tracking
- API performance
- Error handling
"""

import pytest
import httpx
import asyncio
from typing import Dict, Any

# Test configuration
CLAUDE_ENGINE_URL = "http://localhost:8000"
TIMEOUT = 30.0


@pytest.fixture
async def client():
    """Async HTTP client fixture"""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        yield client


@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Test health check endpoint"""
    response = await client.get(f"{CLAUDE_ENGINE_URL}/health")
    
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"].lower() in ["healthy", "ok"]


@pytest.mark.asyncio
async def test_root_endpoint(client):
    """Test root endpoint returns API info"""
    response = await client.get(f"{CLAUDE_ENGINE_URL}/")
    
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "claude" in data["service"].lower()


@pytest.mark.asyncio
async def test_prediction_generation_conservative(client):
    """Test prediction generation with conservative strategy"""
    response = await client.post(
        f"{CLAUDE_ENGINE_URL}/api/v1/predict",
        json={
            "symbol": "BTC/USDT",
            "strategy": "conservative"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Validate response structure
    assert "prediction_type" in data
    assert data["prediction_type"] in ["up", "down"]
    
    assert "confidence" in data
    assert 0.0 <= data["confidence"] <= 1.0
    
    assert "reasoning" in data
    assert len(data["reasoning"]) > 0
    
    assert "input_tokens" in data
    assert data["input_tokens"] > 0
    
    assert "output_tokens" in data
    assert data["output_tokens"] > 0
    
    assert "total_cost_usd" in data
    assert data["total_cost_usd"] > 0


@pytest.mark.asyncio
async def test_prediction_generation_aggressive(client):
    """Test prediction generation with aggressive strategy"""
    response = await client.post(
        f"{CLAUDE_ENGINE_URL}/api/v1/predict",
        json={
            "symbol": "BTC/USDT",
            "strategy": "aggressive"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "prediction_type" in data
    assert "confidence" in data
    # Aggressive strategy might have higher confidence
    assert 0.0 <= data["confidence"] <= 1.0


@pytest.mark.asyncio
async def test_prediction_invalid_symbol(client):
    """Test prediction with invalid symbol"""
    response = await client.post(
        f"{CLAUDE_ENGINE_URL}/api/v1/predict",
        json={
            "symbol": "",  # Empty symbol
            "strategy": "conservative"
        }
    )
    
    assert response.status_code in [400, 422]  # Bad request or validation error


@pytest.mark.asyncio
async def test_prediction_invalid_strategy(client):
    """Test prediction with invalid strategy"""
    response = await client.post(
        f"{CLAUDE_ENGINE_URL}/api/v1/predict",
        json={
            "symbol": "BTC/USDT",
            "strategy": "invalid_strategy"
        }
    )
    
    # Should either accept it or reject with 400/422
    assert response.status_code in [200, 400, 422]


@pytest.mark.asyncio
async def test_prediction_missing_fields(client):
    """Test prediction with missing required fields"""
    response = await client.post(
        f"{CLAUDE_ENGINE_URL}/api/v1/predict",
        json={}
    )
    
    assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_cost_tracking_in_prediction(client):
    """Test that cost tracking is included in prediction response"""
    response = await client.post(
        f"{CLAUDE_ENGINE_URL}/api/v1/predict",
        json={
            "symbol": "BTC/USDT",
            "strategy": "conservative"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify cost tracking fields
    cost_fields = [
        "input_tokens",
        "output_tokens",
        "cached_tokens",
        "total_cost_usd",
        "api_latency_ms"
    ]
    
    for field in cost_fields:
        assert field in data, f"Missing cost field: {field}"
        assert isinstance(data[field], (int, float)), f"Invalid type for {field}"


@pytest.mark.asyncio
async def test_api_documentation(client):
    """Test that API documentation is available"""
    response = await client.get(f"{CLAUDE_ENGINE_URL}/docs")
    
    assert response.status_code == 200
    assert "swagger" in response.text.lower() or "openapi" in response.text.lower()


@pytest.mark.asyncio
async def test_openapi_schema(client):
    """Test OpenAPI schema endpoint"""
    response = await client.get(f"{CLAUDE_ENGINE_URL}/openapi.json")
    
    assert response.status_code == 200
    schema = response.json()
    
    assert "openapi" in schema
    assert "info" in schema
    assert "paths" in schema


@pytest.mark.asyncio
async def test_performance_response_time(client):
    """Test that prediction API responds within acceptable time"""
    import time
    
    start = time.time()
    
    response = await client.post(
        f"{CLAUDE_ENGINE_URL}/api/v1/predict",
        json={
            "symbol": "BTC/USDT",
            "strategy": "conservative"
        }
    )
    
    duration = time.time() - start
    
    assert response.status_code == 200
    # Should respond within 10 seconds
    assert duration < 10.0, f"Response took {duration:.2f}s, expected < 10s"


@pytest.mark.asyncio
async def test_concurrent_predictions(client):
    """Test handling concurrent prediction requests"""
    async def make_prediction():
        return await client.post(
            f"{CLAUDE_ENGINE_URL}/api/v1/predict",
            json={
                "symbol": "BTC/USDT",
                "strategy": "conservative"
            }
        )
    
    # Make 3 concurrent requests
    responses = await asyncio.gather(
        make_prediction(),
        make_prediction(),
        make_prediction()
    )
    
    # All should succeed
    for response in responses:
        assert response.status_code == 200
        data = response.json()
        assert "prediction_type" in data


@pytest.mark.asyncio
async def test_different_symbols(client):
    """Test predictions for different trading symbols"""
    symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT"]
    
    for symbol in symbols:
        response = await client.post(
            f"{CLAUDE_ENGINE_URL}/api/v1/predict",
            json={
                "symbol": symbol,
                "strategy": "conservative"
            }
        )
        
        # Some symbols might not have data, that's ok
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "prediction_type" in data


@pytest.mark.asyncio
async def test_model_version_in_response(client):
    """Test that Claude model version is included in response"""
    response = await client.post(
        f"{CLAUDE_ENGINE_URL}/api/v1/predict",
        json={
            "symbol": "BTC/USDT",
            "strategy": "conservative"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Should include model information
    assert "claude_model" in data or "model" in data
    
    if "claude_model" in data:
        assert "claude" in data["claude_model"].lower()


@pytest.mark.asyncio
async def test_error_handling_network_timeout():
    """Test error handling for network timeouts"""
    # Use very short timeout to force timeout error
    async with httpx.AsyncClient(timeout=0.001) as client:
        try:
            await client.post(
                f"{CLAUDE_ENGINE_URL}/api/v1/predict",
                json={
                    "symbol": "BTC/USDT",
                    "strategy": "conservative"
                }
            )
            # If it somehow succeeds, that's ok
        except (httpx.TimeoutException, httpx.ConnectTimeout):
            # Expected timeout error
            pass


@pytest.mark.asyncio
async def test_cors_headers(client):
    """Test CORS headers are present"""
    response = await client.get(f"{CLAUDE_ENGINE_URL}/health")
    
    assert response.status_code == 200
    # CORS headers should be present
    assert "access-control-allow-origin" in response.headers or \
           "Access-Control-Allow-Origin" in response.headers


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
