import { expect, test } from '@playwright/test'

/** Core routes that should SSR/CSR without auth. */
const paths = [
  '/',
  '/reserve',
  '/documents',
  '/wishlist',
  '/reservations',
  '/profile',
  '/payment-success',
  '/payment-cancel',
] as const

for (const path of paths) {
  test(`${path} loads`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status() ?? 0, `HTTP status for ${path}`).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible()
  })
}
