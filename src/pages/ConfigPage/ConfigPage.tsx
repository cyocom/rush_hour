import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { PageShell } from '../../components/layout/PageShell'
import { StatusCard } from '../../components/status/StatusCard'
import { PriorityTeamList } from '../../components/teams/PriorityTeamList'
import { TeamInputForm } from '../../components/teams/TeamInputForm'
import { useWatchPreferences } from '../../app/watchPreferencesContext'
import { normalizeTeamId, validateTeamInput } from '../../domain/validation/teams'
import { readPersistentPreferences, writePersistentPreferences } from '../../domain/services/persistentPreferences'
import { buildShareUrl } from '../../domain/services/shareUrl'

const Main = styled.main`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 380px;
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: grid;
  gap: 24px;
`;

const RightColumn = styled.aside`
  display: grid;
  gap: 24px;
  align-content: start;
`;

const Panel = styled.section`
  border-radius: 30px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: linear-gradient(180deg, rgb(247 240 232 / 0.96), rgb(238 231 220 / 0.92));
  padding: 24px;
  box-shadow: 0 28px 70px rgb(0 0 0 / 0.14);
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: start;
  }
`;

const Kicker = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgb(150 29 55);
`;

const Title = styled.h2`
  margin: 12px 0 0;
  font-size: 34px;
  line-height: 0.98;
  letter-spacing: -0.06em;
  font-weight: 900;
  color: #0a0a0a;
`;

const Body = styled.p`
  margin: 16px 0 0;
  max-width: 52ch;
  font-size: 17px;
  line-height: 1.7;
  color: rgb(79 75 69);
`;

const CountBadge = styled.div`
  border-radius: 999px;
  background: rgb(255 255 255 / 0.72);
  border: 1px solid rgb(202 192 180);
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(87 81 74);
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #0a0a0a;
`;

const FieldRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

const FieldInput = styled.input`
  flex: 1;
  border-radius: 14px;
  border: 1px solid rgb(202 192 180);
  background: rgb(255 255 255 / 0.9);
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #0a0a0a;
  outline: none;

  &:focus {
    border-color: rgb(150 29 55);
    box-shadow: 0 0 0 3px rgb(150 29 55 / 0.12);
  }

  &[type='password'] {
    letter-spacing: 0.1em;
  }
`;

const ActionButton = styled.button`
  flex-shrink: 0;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, rgb(150 29 55), rgb(184 48 82));
  color: white;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: 140ms ease;

  &:hover {
    opacity: 0.88;
  }

  &:active {
    transform: scale(0.97);
  }
`;

const SecondaryButton = styled.button`
  flex-shrink: 0;
  border-radius: 14px;
  border: 1px solid rgb(202 192 180);
  background: rgb(255 255 255 / 0.85);
  color: rgb(79 75 69);
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: 140ms ease;

  &:hover {
    background: rgb(255 255 255 / 0.95);
  }

  &:active {
    transform: scale(0.97);
  }
`;

const SimRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

const SimToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #0a0a0a;
  cursor: pointer;
`;

const SimToggle = styled.input`
  width: 18px;
  height: 18px;
  accent-color: rgb(150 29 55);
  cursor: pointer;
`;

const StatusIndicator = styled.p<{ $active: boolean }>`
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: ${({ $active }) => ($active ? 'rgb(150 29 55)' : 'rgb(130 120 108)')};
`;

const BulletList = styled.ul`
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
`;

const Bullet = styled.li`
  border-radius: 22px;
  background: rgb(255 255 255 / 0.86);
  padding: 16px;
  font-size: 16px;
  line-height: 1.6;
  color: rgb(79 75 69);
`;

const ShareBody = styled(Body)`
  margin: 0 0 16px;
`;

const ShareActionButton = styled(ActionButton)`
  width: 100%;
`;

const ShareDisabledHint = styled(StatusIndicator)`
  margin-top: 12px;
`;

const ShareControlStack = styled.div`
  display: grid;
  gap: 12px;
`;

const ShareCheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: rgb(79 75 69);
`;

const ShareUrlInput = styled.input`
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgb(202 192 180);
  background: rgb(255 255 255 / 0.9);
  padding: 12px 16px;
  font-size: 14px;
  color: #0a0a0a;
`;

const ShareFeedback = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: ${({ $error }) => ($error ? 'rgb(178 34 34)' : 'rgb(27 132 88)')};
`;

export function ConfigPage() {
  const { trackedTeams, addTeam, removeTeam, reorderTeam } = useWatchPreferences()
  const [error, setError] = useState<string | null>(null)
  const [includeApiKeyInShare, setIncludeApiKeyInShare] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<{ message: string; error?: boolean } | null>(null)
  const shareUrlInputRef = useRef<HTMLInputElement | null>(null)

  // ── Simulation clock state (US2) ──────────────────────────────────────────
  const [simEnabled, setSimEnabled] = useState(false)
  const [simDatetime, setSimDatetime] = useState('')
  const [simRunning, setSimRunning] = useState(false)
  const [simStartedAtISOString, setSimStartedAtISOString] = useState<string | null>(null)
  const [simTickMs, setSimTickMs] = useState(Date.now())

  // ── TBA API key state (US3) ───────────────────────────────────────────────
  const [tbaKeyInput, setTbaKeyInput] = useState('')
  const [tbaKeyConfigured, setTbaKeyConfigured] = useState(false)
  const [persistedTbaApiKey, setPersistedTbaApiKey] = useState<string | null>(null)

  // Load persisted preferences on mount
  useEffect(() => {
    const prefs = readPersistentPreferences()
    setSimEnabled(prefs.simulationClock.enabled)
    setSimDatetime(prefs.simulationClock.simulatedISOString ?? '')
    setSimRunning(prefs.simulationClock.running)
    setSimStartedAtISOString(prefs.simulationClock.startedAtISOString)
    setTbaKeyInput(prefs.tbaApiKey ? `${prefs.tbaApiKey.slice(0, 6)}…` : '')
    setTbaKeyConfigured(!!prefs.tbaApiKey)
    setPersistedTbaApiKey(prefs.tbaApiKey ?? null)
    setIncludeApiKeyInShare(!!prefs.tbaApiKey)
  }, [])

  useEffect(() => {
    if (!simRunning) return
    const id = window.setInterval(() => {
      setSimTickMs(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [simRunning])

  const emptyHint = useMemo(
    () => trackedTeams.length === 0,
    [trackedTeams.length],
  )

  const handleAdd = (teamId: string) => {
    const normalized = normalizeTeamId(teamId)
    const validationError = validateTeamInput(normalized, trackedTeams)

    if (validationError) {
      setError(validationError)
      return
    }

    addTeam(normalized)
    setError(null)
  }

  // ── Simulation clock handlers ─────────────────────────────────────────────
  function toLocalDatetimeInputValue(value: Date): string {
    const pad = (n: number) => `${n}`.padStart(2, '0')
    const yyyy = value.getFullYear()
    const mm = pad(value.getMonth() + 1)
    const dd = pad(value.getDate())
    const hh = pad(value.getHours())
    const min = pad(value.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  }

  function getCurrentSimulatedTime(): Date | null {
    if (!simDatetime) return null
    const base = new Date(simDatetime)
    if (isNaN(base.getTime())) return null

    if (!simRunning || !simStartedAtISOString) {
      return base
    }

    const started = new Date(simStartedAtISOString)
    if (isNaN(started.getTime())) {
      return base
    }

    const elapsed = simTickMs - started.getTime()
    return new Date(base.getTime() + Math.max(0, elapsed))
  }

  function handleSimSave() {
    if (simEnabled && !simDatetime) return
    writePersistentPreferences({
      simulationClock: {
        enabled: simEnabled,
        simulatedISOString: simEnabled ? simDatetime : null,
        running: false,
        startedAtISOString: null,
      },
    })
    setSimRunning(false)
    setSimStartedAtISOString(null)
  }

  function handleSimToggle(checked: boolean) {
    setSimEnabled(checked)
    if (!checked) {
      writePersistentPreferences({
        simulationClock: {
          enabled: false,
          simulatedISOString: null,
          running: false,
          startedAtISOString: null,
        },
      })
      setSimRunning(false)
      setSimStartedAtISOString(null)
    }
  }

  function handleSimStart() {
    if (!simEnabled || !simDatetime) return
    const nowIso = new Date().toISOString()
    writePersistentPreferences({
      simulationClock: {
        enabled: true,
        simulatedISOString: simDatetime,
        running: true,
        startedAtISOString: nowIso,
      },
    })
    setSimRunning(true)
    setSimStartedAtISOString(nowIso)
    setSimTickMs(Date.now())
  }

  function handleSimStop() {
    const current = getCurrentSimulatedTime()
    const frozen = current ? toLocalDatetimeInputValue(current) : simDatetime
    writePersistentPreferences({
      simulationClock: {
        enabled: simEnabled,
        simulatedISOString: frozen || null,
        running: false,
        startedAtISOString: null,
      },
    })
    setSimRunning(false)
    setSimStartedAtISOString(null)
    if (frozen) setSimDatetime(frozen)
  }

  // ── TBA API key handler ───────────────────────────────────────────────────
  function handleTbaKeySave() {
    // If input looks like a masked display value (ends with …), don't overwrite
    if (tbaKeyInput.endsWith('…')) return
    const trimmed = tbaKeyInput.trim()
    writePersistentPreferences({ tbaApiKey: trimmed })
    setTbaKeyConfigured(!!trimmed)
    setPersistedTbaApiKey(trimmed || null)
    setIncludeApiKeyInShare(!!trimmed)
    if (trimmed) {
      setTbaKeyInput(`${trimmed.slice(0, 6)}…`)
    }
  }

  const shareUrl = trackedTeams.length
    ? buildShareUrl(
      trackedTeams.map((team) => team.teamId),
      persistedTbaApiKey,
      includeApiKeyInShare,
    )
    : ''

  async function handleCopyShareUrl() {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareFeedback({ message: 'Copied to clipboard.' })
      window.setTimeout(() => setShareFeedback(null), 2000)
    } catch {
      if (shareUrlInputRef.current) {
        shareUrlInputRef.current.focus()
        shareUrlInputRef.current.select()
      }
      setShareFeedback({ message: 'Clipboard blocked. Select the URL and press Cmd+C.', error: true })
      window.setTimeout(() => setShareFeedback(null), 3000)
    }
  }

  return (
    <PageShell
      title="Config"
      subtitle="Manage your tracked teams and keep priorities in watch-ready order."
    >
      <Main>
        <LeftColumn>
          <Panel>
            <HeadingRow>
              <div>
                <Kicker>Priority editor</Kicker>
                <Title>Build your team stack</Title>
                <Body>
                  Add teams, put them in the order you care about most, and keep your favorites at the top so the watch page feels personal.
                </Body>
              </div>
              <CountBadge>{trackedTeams.length} tracked</CountBadge>
            </HeadingRow>
            <div style={{ marginTop: '24px' }}>
              <TeamInputForm error={error} onSubmit={handleAdd} />
            </div>
          </Panel>

        {emptyHint ? (
          <StatusCard
            title="No teams yet"
            body="Add your first team above to begin building your watch priority list."
          />
        ) : (
          <Panel>
            <Title style={{ marginTop: 0, fontSize: '2.25rem' }}>Priority order</Title>
            <Body style={{ marginTop: '10px' }}>Drag teams into place or use the buttons to move them up and down.</Body>
            <PriorityTeamList teams={trackedTeams} onRemove={removeTeam} onReorder={reorderTeam} />
          </Panel>
        )}

          {/* ── Simulation Clock (US2) ───────────────────────── */}
          <Panel>
            <SectionTitle>Simulation clock</SectionTitle>
            <Body style={{ margin: '0 0 16px' }}>
              Override the effective business time so you can test schedule logic on any date without waiting for a live event.
            </Body>
            <SimRow>
              <SimToggleLabel>
                <SimToggle
                  type="checkbox"
                  checked={simEnabled}
                  onChange={(e) => handleSimToggle(e.target.checked)}
                  data-testid="config-sim-clock-toggle"
                />
                Enable simulation mode
              </SimToggleLabel>
            </SimRow>
            {simEnabled && (
              <FieldRow style={{ marginBottom: '12px' }}>
                <FieldInput
                  type="datetime-local"
                  value={simDatetime}
                  onChange={(e) => setSimDatetime(e.target.value)}
                  data-testid="config-sim-clock-datetime-input"
                />
                <ActionButton
                  onClick={handleSimSave}
                  data-testid="config-sim-clock-save-btn"
                >
                  Save
                </ActionButton>
                {simRunning ? (
                  <SecondaryButton
                    onClick={handleSimStop}
                    data-testid="config-sim-clock-stop-btn"
                  >
                    Stop
                  </SecondaryButton>
                ) : (
                  <SecondaryButton
                    onClick={handleSimStart}
                    data-testid="config-sim-clock-start-btn"
                    disabled={!simEnabled || !simDatetime}
                  >
                    Start
                  </SecondaryButton>
                )}
              </FieldRow>
            )}
            <StatusIndicator
              $active={simEnabled}
              data-testid="config-sim-clock-active-indicator"
            >
              {simEnabled && simDatetime
                ? `Simulating${simRunning ? ' (running)' : ' (paused)'}: ${
                  (getCurrentSimulatedTime() ?? new Date(simDatetime)).toLocaleString()
                }`
                : 'Using real time'}
            </StatusIndicator>
          </Panel>
        </LeftColumn>

        <RightColumn>
          <Panel>
            <Kicker>Helpful tip</Kicker>
            <Title>What rises to the top</Title>
            <BulletList>
              <Bullet>Put your must-watch teams first.</Bullet>
              <Bullet>Keep likely overlap teams near the top for early conflict visibility.</Bullet>
            </BulletList>
          </Panel>

          {/* ── TBA API Key (US3) ────────────────────────────── */}
          <Panel>
            <SectionTitle>TBA API key</SectionTitle>
            <Body style={{ margin: '0 0 16px' }}>
              Required for the schedule page. Get a free read key at{' '}
              <a
                href="https://www.thebluealliance.com/account"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'rgb(150 29 55)', fontWeight: 700 }}
              >
                thebluealliance.com/account
              </a>
              .
            </Body>
            <FieldRow>
              <FieldInput
                type="password"
                placeholder="Paste your TBA read key"
                value={tbaKeyInput}
                onChange={(e) => setTbaKeyInput(e.target.value)}
                onFocus={() => {
                  // Clear masked display so user can type a fresh key
                  if (tbaKeyInput.endsWith('…')) setTbaKeyInput('')
                }}
                data-testid="config-tba-api-key-input"
              />
              <ActionButton
                onClick={handleTbaKeySave}
                data-testid="config-tba-api-key-save-btn"
              >
                Save
              </ActionButton>
            </FieldRow>
            <StatusIndicator
              $active={tbaKeyConfigured}
              data-testid="config-tba-api-key-status"
            >
              {tbaKeyConfigured ? 'Key configured' : 'No key set'}
            </StatusIndicator>
          </Panel>

          {/* ── Share Configuration ────────────────────────── */}
          <Panel>
            <SectionTitle>Share configuration</SectionTitle>
            <ShareBody>
              Generate a shareable URL with your teams and TBA API key to quickly onboard teammates.
            </ShareBody>
            <ShareControlStack>
              {persistedTbaApiKey && (
                <ShareCheckboxLabel>
                  <input
                    type="checkbox"
                    checked={includeApiKeyInShare}
                    onChange={(e) => setIncludeApiKeyInShare(e.target.checked)}
                  />
                  Include TBA API key in URL
                </ShareCheckboxLabel>
              )}
              <ShareUrlInput
                ref={shareUrlInputRef}
                type="text"
                value={shareUrl}
                readOnly
                placeholder="Add teams to generate a share URL"
              />
              <ShareActionButton
                onClick={handleCopyShareUrl}
                disabled={trackedTeams.length === 0}
              >
                Copy Share URL
              </ShareActionButton>
              {shareFeedback && (
                <ShareFeedback $error={shareFeedback.error}>{shareFeedback.message}</ShareFeedback>
              )}
            </ShareControlStack>
            {trackedTeams.length === 0 && (
              <ShareDisabledHint $active={false}>
                Add teams first to enable sharing
              </ShareDisabledHint>
            )}
          </Panel>
        </RightColumn>
      </Main>
    </PageShell>
  )
}
