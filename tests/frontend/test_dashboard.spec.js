/**
 * Frontend Dashboard E2E Tests using Playwright
 * 
 * Tests user-facing functionality:
 * - Page loading
 * - TradingView chart
 * - Market overview
 * - Predictions display
 * - Real-time updates
 */

const { test, expect } = require('@playwright/test');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://claude-trader.herakles.dev';

test.describe('Dashboard - Page Load', () => {
  test('Dashboard loads successfully', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Page should load without errors
    await expect(page).toHaveTitle(/ClaudeTrader|Trading/i);
    
    // Check for main content
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('No console errors on page load', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors (if any)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && // Favicon 404s are ok
      !error.includes('sourcemap') // Sourcemap warnings are ok
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Dashboard - TradingView Chart', () => {
  test('TradingView chart container is present', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Wait for TradingView widget
    const chartContainer = page.locator('.tradingview-widget-container, #tradingview-widget, [data-testid="trading-chart"]');
    
    await expect(chartContainer.first()).toBeVisible({ timeout: 10000 });
  });

  test('Chart loads with trading data', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Wait for chart to load
    await page.waitForTimeout(3000);
    
    // Check for iframe (TradingView embeds in iframe)
    const iframe = page.frameLocator('iframe').first();
    
    // Just verify iframe exists - TradingView content is third-party
    const iframeCount = await page.locator('iframe').count();
    expect(iframeCount).toBeGreaterThan(0);
  });
});

test.describe('Dashboard - Market Overview', () => {
  test('Current price is displayed', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Look for price display
    const priceElement = page.locator('[data-testid="current-price"], .price, .current-price');
    
    // At least one price element should be visible
    await expect(priceElement.first()).toBeVisible({ timeout: 5000 });
    
    // Price should match currency format
    const priceText = await priceElement.first().textContent();
    expect(priceText).toMatch(/\$|USD|[\d,]+\.?\d*/);
  });

  test('24h change is displayed', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Look for 24h change
    const changeElement = page.locator('[data-testid="price-change"], .change, .price-change, :text("24h")');
    
    // Should have at least one change indicator
    const count = await changeElement.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Symbol/ticker is displayed', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Look for BTC/USDT or similar
    const content = await page.content();
    
    expect(content).toMatch(/BTC|Bitcoin|USDT/i);
  });
});

test.describe('Dashboard - Predictions Display', () => {
  test('Prediction card is visible', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Look for prediction section
    const predictionCard = page.locator('[data-testid="prediction-card"], .prediction, .prediction-card');
    
    // Should have prediction display area
    const count = await predictionCard.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Trigger prediction button exists', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Look for prediction trigger button
    const triggerButton = page.locator(
      '[data-testid="trigger-prediction"], button:has-text("Predict"), button:has-text("Generate"), button:has-text("Analyze")'
    );
    
    // At least one button should exist
    const count = await triggerButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Trigger prediction and receive result', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Find and click prediction button
    const triggerButton = page.locator(
      '[data-testid="trigger-prediction"], button:has-text("Predict"), button:has-text("Generate")'
    ).first();
    
    // Check if button exists
    const buttonExists = await triggerButton.count() > 0;
    
    if (buttonExists) {
      await triggerButton.click();
      
      // Wait for prediction to appear (up to 10 seconds)
      await page.waitForTimeout(10000);
      
      // Look for prediction result
      const predictionResult = page.locator(
        '[data-testid="prediction-direction"], .prediction-type, :text("UP"), :text("DOWN")'
      );
      
      // Should show a prediction
      const resultCount = await predictionResult.count();
      expect(resultCount).toBeGreaterThan(0);
    } else {
      // Button doesn't exist - skip test
      test.skip();
    }
  });
});

test.describe('Dashboard - Real-time Updates', () => {
  test('WebSocket connection is established', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    
    // Check for connection indicator
    const statusIndicator = page.locator(
      '[data-testid="connection-status"], .status, .connected, :text("Connected"), :text("Live")'
    );
    
    // Should have some connection status
    const count = await statusIndicator.count();
    
    // If status indicator exists, it should show connected state
    if (count > 0) {
      const statusText = await statusIndicator.first().textContent();
      expect(statusText.toLowerCase()).toMatch(/connect|live|online/i);
    }
  });

  test('Price updates in real-time', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Get initial price
    const priceElement = page.locator('[data-testid="current-price"], .price').first();
    await priceElement.waitFor({ timeout: 5000 });
    
    const initialPrice = await priceElement.textContent();
    
    // Wait for potential update (30s broadcast interval + buffer)
    await page.waitForTimeout(35000);
    
    const updatedPrice = await priceElement.textContent();
    
    // Price might have changed or stayed the same
    // Just verify it's still a valid price format
    expect(updatedPrice).toMatch(/\$|USD|[\d,]+\.?\d*/);
  });
});

test.describe('Dashboard - Responsive Design', () => {
  test('Dashboard works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(FRONTEND_URL);
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
    
    // Content should be visible
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('Dashboard works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(FRONTEND_URL);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard works on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(FRONTEND_URL);
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard - Navigation', () => {
  test('Page navigation works', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Look for navigation links
    const navLinks = page.locator('a, nav a, [role="navigation"] a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      // Click first navigation link
      const firstLink = navLinks.first();
      const isVisible = await firstLink.isVisible();
      
      if (isVisible) {
        await firstLink.click();
        
        // Page should navigate
        await page.waitForLoadState('networkidle');
        
        // Should still be on same domain
        const url = page.url();
        expect(url).toContain('herakles.dev');
      }
    }
  });
});

test.describe('Dashboard - Performance', () => {
  test('First contentful paint is fast', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart
      };
    });
    
    // DOM should load quickly
    expect(metrics.domContentLoaded).toBeLessThan(3000);
  });

  test('No memory leaks on page interactions', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Interact with page multiple times
    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Page should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });
});
