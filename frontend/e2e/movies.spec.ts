import { test, expect } from '@playwright/test';

test('movies page renders the catalog header', async ({ page }) => {
  // Arrange
  await page.goto('/movies', { waitUntil: 'domcontentloaded' });
  
  // Assert
  await expect(page.getByRole('heading', { name: /movie catalog/i })).toBeVisible();
  await expect(page.getByPlaceholder('Search by title...')).toBeVisible();
});

test('movies page displays at least one movie', async ({ page }) => {
  // Arrange
  await page.goto('/movies', { waitUntil: 'domcontentloaded' });
  
  // Act
  await page.waitForSelector('article', { timeout: 10000 });
  const movieCards = page.locator('article');
  
  // Assert
  await expect(movieCards.first()).toBeVisible();
  const firstCard = movieCards.first();
  await expect(firstCard.locator('img')).toBeVisible();
  await expect(firstCard.locator('h3')).toBeVisible();
  await expect(firstCard.locator('p')).toBeVisible();
});
