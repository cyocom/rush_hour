import { expect, test } from '@playwright/test'

test('watch and config are responsive at mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/#/watch')
  await expect(page.getByRole('main')).toBeVisible()

  await page.goto('/#/config')
  await expect(page.getByRole('main')).toBeVisible()
})
