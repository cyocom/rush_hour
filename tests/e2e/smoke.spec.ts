import { expect, test } from '@playwright/test'

test('watch and config routes are reachable', async ({ page }) => {
  await page.goto('/watch')
  await expect(page.getByRole('main')).toBeVisible()

  await page.goto('/config')
  await expect(page.getByRole('main')).toBeVisible()
})
