import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Small Business Web Design Company USA/);
    await expect(page.locator('h1')).toContainText('Small Business Web Design That Converts');
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /#1 small business web design company/);
    
    // Check canonical URL
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://www.acewebdesigners.com/');
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.click('text=GET MY FREE DESIGN NOW!');
    await expect(page.url()).toContain('/contact');
  });

  test('should navigate to services page', async ({ page }) => {
    await page.click('text=View Services');
    await expect(page.url()).toContain('/services');
  });

  test('should have working navigation menu', async ({ page }) => {
    // Test desktop navigation
    await page.click('text=About Us');
    await expect(page.url()).toContain('/about');
    
    await page.click('text=Our Work');
    await expect(page.url()).toContain('/work');
    
    await page.click('text=Services');
    await expect(page.url()).toContain('/services');
  });

  test('should have mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile menu button exists
    const mobileMenuButton = page.locator('[aria-label="Toggle menu"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Open mobile menu
    await mobileMenuButton.click();
    
    // Check mobile menu items are visible
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=About Us')).toBeVisible();
  });

  test('should load performance metrics section', async ({ page }) => {
    const performanceSection = page.locator('text=Built for Speed, Security & Success');
    await expect(performanceSection).toBeVisible();
    
    // Check performance metrics are displayed
    await expect(page.locator('text=2.3s')).toBeVisible();
    await expect(page.locator('text=99.9%')).toBeVisible();
    await expect(page.locator('text=SSL')).toBeVisible();
  });

  test('should have working FAQ section', async ({ page }) => {
    // Scroll to FAQ section
    await page.locator('text=Frequently Asked Questions').scrollIntoViewIfNeeded();
    
    // Click on first FAQ
    await page.click('text=How much does a website cost?');
    
    // Check answer is visible
    await expect(page.locator('text=Our websites start at $200')).toBeVisible();
  });

  test('should have proper structured data', async ({ page }) => {
    // Check for JSON-LD structured data
    const structuredData = page.locator('script[type="application/ld+json"]');
    await expect(structuredData).toHaveCount(4); // Organization, Website, FAQ, Service schemas
  });

  test('should pass accessibility checks', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt');
    }
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();
      
      expect(hasAriaLabel || hasText).toBeTruthy();
    }
  });
});

