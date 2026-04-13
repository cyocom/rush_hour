import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ConflictList } from '../../components/alerts/ConflictList'
import { UpcomingAlertsList } from '../../components/alerts/UpcomingAlertsList'
import { PageShell } from '../../components/layout/PageShell'
import { StatusCard } from '../../components/status/StatusCard'
import { MockStreamPanel } from '../../components/stream/MockStreamPanel'
import { loadMockMatchWindows } from '../../data/mock/matches'
import { deriveUpcomingAlerts } from '../../domain/services/alerts'
import { deriveMatchConflicts } from '../../domain/services/conflicts'
import { useWatchPreferences } from '../../app/watchPreferencesContext'

const Main = styled.main`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.82fr);
  margin-top: 24px;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: grid;
  gap: 24px;
`;

const RightColumn = styled.div`
  display: grid;
  gap: 24px;
  align-content: start;
`;

const LightPanel = styled.section`
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

const Kicker = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgb(150 29 55);
`;

const KickerLight = styled(Kicker)`
  color: rgb(255 210 221 / 0.8);
`;

const SectionTitle = styled.h2`
  margin: 12px 0 0;
  font-size: 34px;
  line-height: 0.98;
  letter-spacing: -0.06em;
  font-weight: 900;
  color: #0a0a0a;
`;

const SectionTitleLight = styled(SectionTitle)`
  color: white;
`;

const SectionBody = styled.p`
  margin: 16px 0 0;
  font-size: 17px;
  line-height: 1.7;
  color: rgb(79 75 69);
`;

const SectionBodyLight = styled(SectionBody)`
  color: rgb(255 255 255 / 0.72);
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  border-radius: 24px;
  background: rgb(255 255 255 / 0.84);
  border: 1px solid rgb(207 197 186);
  padding: 18px;
`;

const MetricLabel = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(110 102 93);
`;

const MetricValue = styled.p`
  margin: 12px 0 0;
  font-size: 38px;
  line-height: 1;
  letter-spacing: -0.08em;
  font-weight: 900;
  color: #0a0a0a;
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(135deg, rgb(150 29 55), rgb(184 48 82));
  color: white;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 18px 30px rgb(150 29 55 / 0.2);
`;

export function WatchPage() {
  const { trackedTeams } = useWatchPreferences()
  const alerts = deriveUpcomingAlerts(loadMockMatchWindows(), trackedTeams)
  const conflicts = deriveMatchConflicts(alerts)

  return (
    <PageShell
      title="Watch"
      subtitle="Track upcoming matches for your selected teams and catch overlap conflicts early."
      eyebrow="Rushhour Match Desk"
    >
      <Main>
        <LeftColumn>
          <MockStreamPanel />

          <LightPanel>
            <Kicker>Overview</Kicker>
            <SectionTitle>Priority snapshot</SectionTitle>
            <MetricGrid>
              <MetricCard>
                <MetricLabel>Tracked teams</MetricLabel>
                <MetricValue>{trackedTeams.length}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Upcoming alerts</MetricLabel>
                <MetricValue>{alerts.length}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Conflicts</MetricLabel>
                <MetricValue>{conflicts.length}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Mode</MetricLabel>
                <MetricValue>Mock</MetricValue>
              </MetricCard>
            </MetricGrid>
          </LightPanel>

          {alerts.length > 0 ? <UpcomingAlertsList alerts={alerts} /> : null}
        </LeftColumn>

        <RightColumn>
          <DarkPanel>
            <KickerLight>Operator note</KickerLight>
            <SectionTitleLight>Watchline guidance</SectionTitleLight>
            <SectionBodyLight>
              Use this view like a production desk: stream on the left, priority state on the right, and conflict calls surfaced before matches overlap.
            </SectionBodyLight>
          </DarkPanel>

        {trackedTeams.length === 0 ? (
          <StatusCard
            title="No teams configured"
            body="Add your first team in Config to start getting upcoming watch alerts."
            action={<ActionLink to="/config">Go to Config</ActionLink>}
          />
        ) : null}

        {trackedTeams.length > 0 && alerts.length === 0 ? (
          <StatusCard
            title="No upcoming tracked matches"
            body="Your tracked teams are set, but none of them appear in the upcoming mock schedule right now."
          />
        ) : null}

        {conflicts.length > 0 ? <ConflictList conflicts={conflicts} /> : null}
        </RightColumn>
      </Main>
    </PageShell>
  )
}
