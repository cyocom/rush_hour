import { expect, test, type Page } from '@playwright/test'

async function seedWatchPreferences(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'rushhour.appPreferences.v1',
      JSON.stringify({
        schemaVersion: 'v1',
        tbaApiKey: 'test-key',
        subscribedTeams: [
          { teamId: '254', addedAt: '2026-03-10T00:00:00.000Z' },
          { teamId: '1678', addedAt: '2026-03-10T00:00:01.000Z' },
        ],
        simulationClock: {
          enabled: true,
          simulatedISOString: '2026-03-12T12:00:00.000Z',
          running: false,
          startedAtISOString: null,
        },
      }),
    )
  })
}

async function mockTbaApi(page: Page) {
  await page.route('**/api/v3/team/frc*/events/*/simple', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          key: '2026txhou',
          name: 'Houston District',
          start_date: '2026-03-10',
          end_date: '2026-03-14',
          event_type: 0,
          city: 'Houston',
          state_prov: 'TX',
        },
      ]),
    })
  })

  await page.route('**/api/v3/event/2026txhou/matches/simple', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          key: '2026txhou_qm1',
          event_key: '2026txhou',
          comp_level: 'qm',
          set_number: 1,
          match_number: 1,
          alliances: {
            red: { team_keys: ['frc254', 'frc1114', 'frc2056'], score: null },
            blue: { team_keys: ['frc1678', 'frc971', 'frc118'], score: null },
          },
          time: null,
          predicted_time: 1893456000,
          actual_time: null,
          winning_alliance: null,
        },
        {
          key: '2026txhou_qm2',
          event_key: '2026txhou',
          comp_level: 'qm',
          set_number: 1,
          match_number: 2,
          alliances: {
            red: { team_keys: ['frc254', 'frc148', 'frc3310'], score: null },
            blue: { team_keys: ['frc604', 'frc987', 'frc3476'], score: null },
          },
          time: null,
          predicted_time: 1893456180,
          actual_time: null,
          winning_alliance: null,
        },
      ]),
    })
  })

  await page.route('**/api/v3/event/2026txhou', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        key: '2026txhou',
        name: 'Houston District',
        start_date: '2026-03-10',
        end_date: '2026-03-14',
        event_type: 0,
        city: 'Houston',
        state_prov: 'TX',
        webcasts: [
          { type: 'twitch', channel: 'firstinspires' },
          { type: 'youtube', channel: 'abc123video' },
        ],
      }),
    })
  })
}

test('watch page renders webcast, alerts, and conflicts', async ({ page }) => {
  await seedWatchPreferences(page)
  await mockTbaApi(page)

  await page.goto('/#/watch')

  await expect(page.getByTestId('watch-stream-panel')).toBeVisible()
  await expect(page.getByTestId('watch-alert-list')).toBeVisible()
  await expect(page.getByTestId('watch-conflict-list')).toBeVisible()
  await expect(page.getByText('How to use this page')).toHaveCount(0)
})

test('watch page layout is responsive at 375 and 768', async ({ page }) => {
  await seedWatchPreferences(page)
  await mockTbaApi(page)

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/#/watch')
  await expect(page.getByRole('tablist')).toBeVisible()
  await expect(page.getByTestId('watch-stream-panel')).toBeVisible()

  const iframe375 = page.locator('[data-testid="watch-stream-panel"] iframe')
  await expect(iframe375).toBeVisible()

  await page.setViewportSize({ width: 768, height: 1024 })
  await page.reload()
  await expect(page.getByRole('tablist')).toBeVisible()
  await expect(page.getByTestId('watch-stream-panel')).toBeVisible()
})
