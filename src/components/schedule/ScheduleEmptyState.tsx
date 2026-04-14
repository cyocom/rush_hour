import { Link } from 'react-router-dom'
import styled from 'styled-components'

type EmptyVariant = 'no-subscribed-teams' | 'no-active-events' | 'no-api-key'

interface ScheduleEmptyStateProps {
  variant: EmptyVariant
  effectiveTimeDisplay?: string
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 64px 24px;
  gap: 16px;
`;

const Icon = styled.div`
  font-size: 48px;
  line-height: 1;
`;

const Heading = styled.h3`
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: white;
`;

const Body = styled.p`
  margin: 0;
  max-width: 44ch;
  font-size: 15px;
  line-height: 1.65;
  color: rgb(255 255 255 / 0.68);
`;

const EffectiveTime = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: rgb(255 221 228 / 0.7);
`;

const ConfigLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
  background: linear-gradient(135deg, rgb(150 29 55), rgb(184 48 82));
  color: white;
  border: none;
  text-decoration: none;
  margin-top: 8px;
  transition: 140ms ease;

  &:hover {
    opacity: 0.88;
  }
`;

export function ScheduleEmptyState({ variant, effectiveTimeDisplay }: ScheduleEmptyStateProps) {
  if (variant === 'no-api-key') {
    return (
      <Container data-testid="schedule-no-api-key-prompt">
        <Icon>🔑</Icon>
        <Heading>TBA API key required</Heading>
        <Body>
          The schedule page fetches live event data from The Blue Alliance, which requires an API
          key. Add yours on the Config page to get started.
        </Body>
        <ConfigLink to="/config">Go to Config</ConfigLink>
      </Container>
    )
  }

  if (variant === 'no-subscribed-teams') {
    return (
      <Container data-testid="schedule-empty-state">
        <Icon>📋</Icon>
        <Heading>No subscribed teams yet</Heading>
        <Body>
          Subscribe to at least one team on the Config page so the schedule knows which events to
          pull matches from.
        </Body>
        <ConfigLink to="/config">Go to Config</ConfigLink>
      </Container>
    )
  }

  // no-active-events
  return (
    <Container data-testid="schedule-empty-state">
      <Icon>📅</Icon>
      <Heading>No active events found</Heading>
      <Body>
        None of your subscribed teams have an event running at the effective business time. Try
        adjusting the simulation clock on the Config page to a competition weekend.
      </Body>
      {effectiveTimeDisplay && (
        <EffectiveTime>Effective time: {effectiveTimeDisplay}</EffectiveTime>
      )}
      <ConfigLink to="/config">Adjust simulation clock</ConfigLink>
    </Container>
  )
}
