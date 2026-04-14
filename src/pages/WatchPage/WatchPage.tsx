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
  margin-top: 24px;
`;

const LowerGrid = styled.section`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(640px, 1.15fr) minmax(460px, 0.85fr);
  align-items: start;
  overflow-x: auto;
  padding-bottom: 6px;
`;

const PrimaryColumn = styled.div`
  display: grid;
  gap: 24px;
  min-width: 640px;
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
      immersive
    >
      <Main>
        <PrimaryColumn>
            {alerts.length > 0 ? <UpcomingAlertsList alerts={alerts} /> : null}
            {conflicts.length > 0 ? <ConflictList conflicts={conflicts} /> : null}
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
                body="Your teams are selected, but none of them show up in the upcoming schedule right now."
              />
            ) : null}
        </PrimaryColumn>

        <MockStreamPanel />

        <LowerGrid>

            <DarkPanel>
              <KickerLight>Good to know</KickerLight>
              <SectionTitleLight>How to use this page</SectionTitleLight>
              <SectionBodyLight>
                Keep the stream front and center, then use the match cards and warnings below when you want a quick read on what is coming up.
              </SectionBodyLight>
            </DarkPanel>
        </LowerGrid>
      </Main>
    </PageShell>
  )
}
