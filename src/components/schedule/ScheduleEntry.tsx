import styled from 'styled-components'
import type { ScheduledMatchEntry } from '../../domain/models/schedule'
import { formatMatchTime } from '../../domain/services/scheduleBuilder'

interface ScheduleEntryProps {
  entry: ScheduledMatchEntry
  hasTimeConflict?: boolean
}

const Row = styled.li<{ $warning: boolean }>`
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 16px;
  align-items: start;
  border-radius: 18px;
  border: 1px solid ${({ $warning }) => ($warning ? 'rgb(255 184 0 / 0.8)' : 'rgb(255 255 255 / 0.08)')};
  background: linear-gradient(180deg, rgb(22 25 32 / 0.96), rgb(17 20 26 / 0.92));
  padding: 16px 20px;
  box-shadow: ${({ $warning }) => ($warning ? '0 0 0 2px rgb(255 184 0 / 0.2)' : 'none')};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const TimeCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TimeText = styled.span`
  font-size: 15px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.01em;
`;

const TimeTbd = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: rgb(255 255 255 / 0.45);
  font-style: italic;
`;

const MatchInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EventLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(255 221 228 / 0.65);
`;

const MatchLabel = styled.span`
  font-size: 17px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: white;
`;

const TeamsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;

  @media (max-width: 640px) {
    justify-content: flex-start;
  }
`;

const TeamChip = styled.span<{ $alliance: 'red' | 'blue' | undefined }>`
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: ${({ $alliance }) =>
    $alliance === 'red'
      ? 'linear-gradient(135deg, rgb(180 30 40), rgb(220 50 65))'
      : $alliance === 'blue'
        ? 'linear-gradient(135deg, rgb(25 70 180), rgb(40 100 220))'
        : 'rgb(255 255 255 / 0.07)'};
  color: ${({ $alliance }) => ($alliance ? 'white' : 'rgb(255 255 255 / 0.65)')};
  border: 1px solid
    ${({ $alliance }) => ($alliance ? 'rgb(255 255 255 / 0.18)' : 'rgb(255 255 255 / 0.06)')};
`;

export function ScheduleEntry({ entry, hasTimeConflict = false }: ScheduleEntryProps) {
  const formattedTime = formatMatchTime(entry.predictedTime)

  return (
    <Row data-testid="schedule-match-entry" $warning={hasTimeConflict}>
      <TimeCell data-testid="schedule-match-entry-time">
        {entry.hasPredictedTime && formattedTime ? (
          <TimeText>{formattedTime}</TimeText>
        ) : (
          <TimeTbd>Time TBD</TimeTbd>
        )}
      </TimeCell>

      <MatchInfo>
        <EventLabel>{entry.eventName}</EventLabel>
        <MatchLabel>{entry.matchLabel}</MatchLabel>
      </MatchInfo>

      <TeamsCell data-testid="schedule-match-entry-teams">
        {entry.allTeamKeys.map((teamKey) => {
          const teamNumber = teamKey.replace(/^frc/, '')
          const alliance = entry.subscribedTeamAlliances[teamNumber]
          return (
            <TeamChip key={teamKey} $alliance={alliance}>
              {teamNumber}
            </TeamChip>
          )
        })}
      </TeamsCell>
    </Row>
  )
}
