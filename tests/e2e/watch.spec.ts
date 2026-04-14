import { expect, test } from '@playwright/test'

test('watch page renders stream and alert sections', async ({ page }) => {
  await page.goto('/config')
  await page.getByLabel('Team identifier').fill('frc254')
  await page.getByRole('button', { name: 'Add' }).click()

  await page.goto('/watch')
  await expect(page.getByTestId('watch-stream-panel')).toBeVisible()
  await expect(page.getByTestId('watch-alert-list')).toBeVisible()
})
