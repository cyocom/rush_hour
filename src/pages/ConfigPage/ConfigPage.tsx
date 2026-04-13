import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { PageShell } from '../../components/layout/PageShell'
import { StatusCard } from '../../components/status/StatusCard'
import { PriorityTeamList } from '../../components/teams/PriorityTeamList'
import { TeamInputForm } from '../../components/teams/TeamInputForm'
import { useWatchPreferences } from '../../app/watchPreferencesContext'
import { normalizeTeamId, validateTeamInput } from '../../domain/validation/teams'

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

const DarkPanel = styled.section`
  border-radius: 30px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: linear-gradient(180deg, rgb(20 22 28 / 0.96), rgb(14 16 22 / 0.94));
  color: white;
  padding: 24px;
  box-shadow: 0 28px 70px rgb(0 0 0 / 0.18);
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

const DarkKicker = styled(Kicker)`
  color: rgb(255 220 228 / 0.76);
`;

const Title = styled.h2`
  margin: 12px 0 0;
  font-size: 34px;
  line-height: 0.98;
  letter-spacing: -0.06em;
  font-weight: 900;
  color: #0a0a0a;
`;

const DarkTitle = styled(Title)`
  color: white;
`;

const Body = styled.p`
  margin: 16px 0 0;
  max-width: 52ch;
  font-size: 17px;
  line-height: 1.7;
  color: rgb(79 75 69);
`;

const DarkBody = styled(Body)`
  color: rgb(255 255 255 / 0.72);
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

const DarkMetric = styled.div`
  border-radius: 22px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(255 255 255 / 0.05);
  padding: 16px;
`;

const MetricLabel = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.56);
`;

const MetricText = styled.p`
  margin: 10px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgb(255 255 255 / 0.78);
`;

export function ConfigPage() {
  const { trackedTeams, addTeam, removeTeam, reorderTeam } = useWatchPreferences()
  const [error, setError] = useState<string | null>(null)

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

  return (
    <PageShell
      title="Config"
      subtitle="Manage your tracked teams and keep priorities in watch-ready order."
      eyebrow="Rushhour Control Room"
    >
      <Main>
        <LeftColumn>
          <Panel>
            <HeadingRow>
              <div>
                <Kicker>Priority editor</Kicker>
                <Title>Build your team stack</Title>
                <Body>
                  Add teams, reorder them for watch priority, and keep the session lightweight. The top of the stack drives the most important alerts first.
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
            <Body style={{ marginTop: '10px' }}>Drag or use keyboard controls to reorder teams.</Body>
            <PriorityTeamList teams={trackedTeams} onRemove={removeTeam} onReorder={reorderTeam} />
          </Panel>
        )}
        </LeftColumn>

        <RightColumn>
          <DarkPanel>
            <DarkKicker>Modern navigation</DarkKicker>
            <DarkTitle>Desk-ready workflow</DarkTitle>
            <DarkBody>
              Configure here, then move straight into Watch with a cleaner route hierarchy and stronger visual separation between setup and live monitoring.
            </DarkBody>
            <div style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
              <DarkMetric>
                <MetricLabel>Persistence</MetricLabel>
                <MetricText>Session storage keeps ranking stable across reloads.</MetricText>
              </DarkMetric>
              <DarkMetric>
                <MetricLabel>Control scheme</MetricLabel>
                <MetricText>Drag-and-drop plus button-based keyboard fallback.</MetricText>
              </DarkMetric>
            </div>
          </DarkPanel>

          <Panel>
            <Kicker>Order strategy</Kicker>
            <Title>What rises to the top</Title>
            <BulletList>
              <Bullet>Put your must-watch alliance captains first.</Bullet>
              <Bullet>Keep likely overlap teams near the top for early conflict visibility.</Bullet>
              <Bullet>Trim inactive teams to reduce noise on the Watch route.</Bullet>
            </BulletList>
          </Panel>
        </RightColumn>
      </Main>
    </PageShell>
  )
}
