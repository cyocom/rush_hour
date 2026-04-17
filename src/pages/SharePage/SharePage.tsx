import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { decodeSharePayload } from '../../domain/services/shareUrl'
import { writePersistentPreferences } from '../../domain/services/persistentPreferences'
import { PageShell } from '../../components/layout/PageShell'

const Main = styled.main`
  margin-top: 24px;
  display: grid;
  justify-items: center;
`

const Panel = styled.section`
  width: min(680px, 100%);
  border-radius: 30px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: linear-gradient(180deg, rgb(247 240 232 / 0.96), rgb(238 231 220 / 0.92));
  box-shadow: 0 28px 70px rgb(0 0 0 / 0.14);
  padding: 28px;
`

const DialogTitle = styled.h1`
  margin: 0;
  font-size: 32px;
  line-height: 0.95;
  letter-spacing: -0.05em;
  font-weight: 900;
  color: #0a0a0a;
`

const Intro = styled.p`
  margin: 14px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgb(79 75 69);
`

const TeamsList = styled.div`
  margin-top: 20px;
  background: rgb(255 255 255 / 0.82);
  border-radius: 18px;
  border: 1px solid rgb(210 198 184);
  padding: 16px;
  max-height: 260px;
  overflow-y: auto;
`

const TeamsLabel = styled.h2`
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(87 81 74);
`

const TeamItem = styled.div`
  padding: 10px 0;
  color: #2f2b27;
  font-size: 15px;
  font-weight: 700;
  &:not(:last-child) {
    border-bottom: 1px solid rgb(226 220 210);
  }
`

const StatusBadge = styled.div<{ type: 'info' | 'warning' }>`
  margin-top: 14px;
  background: ${props => (props.type === 'info' ? 'rgb(237 242 255)' : 'rgb(255 244 220)')};
  border: 1px solid ${props => (props.type === 'info' ? 'rgb(189 206 255)' : 'rgb(247 209 140)')};
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 700;
  color: ${props => (props.type === 'info' ? 'rgb(49 71 172)' : 'rgb(138 86 16)')};
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  font-size: 14px;
  color: rgb(79 75 69);
  font-weight: 700;
  cursor: pointer;
  
  input {
    cursor: pointer;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 20px;
  border-radius: 14px;
  font-weight: 800;
  letter-spacing: 0.05em;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  
  ${props =>
    props.variant === 'primary'
      ? `
    background: linear-gradient(135deg, rgb(150 29 55), rgb(184 48 82));
    color: white;
    &:hover {
      opacity: 0.9;
    }
  `
      : `
    background: rgb(255 255 255 / 0.8);
    color: rgb(79 75 69);
    border: 1px solid rgb(202 192 180);
    &:hover {
      background: rgb(255 255 255 / 0.95);
    }
  `}
`

function buildWatchRedirectUrl(): string {
  if (typeof window === 'undefined') {
    return '/#/watch'
  }

  const normalizedPath = window.location.pathname.replace(/\/$/, '')
  const basePath = normalizedPath === '/' ? '' : normalizedPath
  return `${window.location.origin}${basePath}/#/watch`
}

export function SharePage() {
  const { payload } = useParams<{ payload: string }>()
  const [decoded, setDecoded] = useState<{ teams: string[]; apiKey: string | null } | null>(null)
  const [skipApiKey, setSkipApiKey] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!payload) {
      window.location.replace(buildWatchRedirectUrl())
      return
    }

    const result = decodeSharePayload(payload)
    if (!result) {
      // Malformed payload - silently redirect
      window.location.replace(buildWatchRedirectUrl())
      return
    }

    setDecoded(result)
    setLoading(false)
  }, [payload])

  const handleAccept = () => {
    if (!decoded) return

    // Write to preferences
    writePersistentPreferences({
      subscribedTeams: decoded.teams.map(teamId => ({
        teamId,
        addedAt: new Date().toISOString(),
      })),
      tbaApiKey: skipApiKey ? '' : decoded.apiKey || '',
    })

    // Redirect to watch page with full reload
    window.location.replace(buildWatchRedirectUrl())
  }

  const handleDecline = () => {
    // Redirect to watch page without making changes
    window.location.replace(buildWatchRedirectUrl())
  }

  if (loading || !decoded) {
    return null
  }

  return (
    <PageShell
      title="Shared Config"
      subtitle="Review this shared setup before importing it into your local preferences."
    >
      <Main>
        <Panel>
          <DialogTitle>Import shared configuration?</DialogTitle>
          <Intro>Choose whether to import this shared team list and optional API key.</Intro>

          <TeamsList>
            <TeamsLabel>Teams</TeamsLabel>
            {decoded.teams.map(team => (
              <TeamItem key={team}>{team}</TeamItem>
            ))}
          </TeamsList>

          {decoded.apiKey && (
            <>
              <StatusBadge type="info">TBA API key included</StatusBadge>

              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={skipApiKey}
                  onChange={e => setSkipApiKey(e.target.checked)}
                />
                Skip importing the API key
              </CheckboxLabel>
            </>
          )}

          {!decoded.apiKey && (
            <StatusBadge type="warning">No API key included, teams only</StatusBadge>
          )}

          <ButtonGroup>
            <Button variant="secondary" onClick={handleDecline}>
              Decline
            </Button>
            <Button variant="primary" onClick={handleAccept}>
              Import
            </Button>
          </ButtonGroup>
        </Panel>
      </Main>
    </PageShell>
  )
}
