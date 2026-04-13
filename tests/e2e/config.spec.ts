import { expect, test } from '@playwright/test'

test('config add and reorder workflow', async ({ page }) => {
  await page.goto('/config')
  await page.getByLabel('Team identifier').fill('frc254')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('Team identifier').fill('frc1678')
  await page.getByRole('button', { name: 'Add' }).click()

  await page.getByRole('button', { name: 'Up' }).nth(1).click()
  await expect(page.getByTestId('config-team-list')).toBeVisible()
})
