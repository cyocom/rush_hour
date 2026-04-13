import styled from 'styled-components'

const Panel = styled.section`
  position: relative;
  overflow: hidden;
  border-radius: 32px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background:
    radial-gradient(circle at top right, rgb(150 29 55 / 0.22), transparent 26%),
    linear-gradient(180deg, #16171d 0%, #13151a 50%, #120f15 100%);
  color: white;
  padding: 28px;
  box-shadow: 0 34px 80px rgb(0 0 0 / 0.3);
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
`;

const Kicker = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.7);
`;

const Title = styled.h2`
  margin: 14px 0 0;
  font-size: clamp(2rem, 3vw, 3.3rem);
  line-height: 0.95;
  letter-spacing: -0.07em;
  font-weight: 900;
`;

const Body = styled.p`
  margin: 16px 0 0;
  max-width: 720px;
  font-size: 18px;
  line-height: 1.65;
  color: rgb(255 255 255 / 0.72);
`;

const LiveBadge = styled.div`
  border-radius: 999px;
  border: 1px solid rgb(82 221 160 / 0.22);
  background: rgb(82 221 160 / 0.1);
  padding: 12px 18px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgb(165 249 210);
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 18px;
  margin-top: 26px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Player = styled.div`
  position: relative;
  overflow: hidden;
  min-height: 520px;
  border-radius: 28px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background:
    radial-gradient(circle at top, rgb(114 19 46 / 0.24), transparent 34%),
    linear-gradient(180deg, #241724 0%, #15161d 42%, #090b0f 100%);

  @media (max-width: 980px) {
    min-height: 420px;
  }
`;

const Scanlines = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 0%, rgb(255 255 255 / 0.03) 50%, transparent 100%);
  background-size: 100% 10px;
  opacity: 0.35;
`;

const PlayerTop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 18px 20px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.72);
`;

const Crosshair = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgb(255 255 255 / 0.08);
  }

  &::before {
    width: 1px;
    height: 56%;
  }

  &::after {
    height: 1px;
    width: 56%;
  }
`;

const PlayButton = styled.div`
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.18);
  background: rgb(255 255 255 / 0.08);
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 50px rgb(0 0 0 / 0.28);

  &::before {
    content: '';
    margin-left: 8px;
    border-top: 18px solid transparent;
    border-bottom: 18px solid transparent;
    border-left: 28px solid white;
  }
`;

const BottomBar = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 20px;
  background: linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 0.75) 100%);

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: start;
  }
`;

const DeckLabel = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.62);
`;

const DeckTitle = styled.p`
  margin: 8px 0 0;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.04em;
`;

const CameraBadge = styled.div`
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.12);
  background: rgb(0 0 0 / 0.3);
  padding: 12px 18px;
  font-size: 13px;
  color: rgb(255 255 255 / 0.76);
`;

const SideStack = styled.div`
  display: grid;
  gap: 16px;
`;

const SideCard = styled.div`
  border-radius: 24px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(255 255 255 / 0.05);
  padding: 18px;
  backdrop-filter: blur(10px);
`;

const SideCardLabel = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.56);
`;

const SideCardValue = styled.h3`
  margin: 14px 0 0;
  font-size: 24px;
  line-height: 1.05;
  letter-spacing: -0.05em;
  font-weight: 900;
`;

const SideCardBody = styled.p`
  margin: 10px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgb(255 255 255 / 0.68);
`;

const ControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
`;

const Control = styled.span`
  border-radius: 999px;
  background: rgb(255 255 255 / 0.1);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
`;

export function MockStreamPanel() {
  return (
    <Panel data-testid="watch-stream-panel" aria-label="Live stream panel">
      <TopRow>
        <div>
          <Kicker>Mock stream</Kicker>
          <Title>Field Stream A</Title>
          <Body>
            Placeholder broadcast module with stronger production framing, telemetry, and a more convincing control-room presence.
          </Body>
        </div>
        <LiveBadge>Live demo</LiveBadge>
      </TopRow>

      <ContentGrid>
        <Player>
          <Scanlines />
          <PlayerTop>
            <span>Einstein warmup</span>
            <span>16:9 placeholder</span>
          </PlayerTop>
          <Crosshair>
            <PlayButton />
          </Crosshair>
          <BottomBar>
            <div>
              <DeckLabel>On deck</DeckLabel>
              <DeckTitle>Qualification Cycle</DeckTitle>
            </div>
            <CameraBadge>Camera preset: Wide field</CameraBadge>
          </BottomBar>
        </Player>

        <SideStack>
          <SideCard>
            <SideCardLabel>Broadcast mode</SideCardLabel>
            <SideCardValue>Observer layout</SideCardValue>
            <SideCardBody>Priority overlays tuned for quick scanning.</SideCardBody>
          </SideCard>
          <SideCard>
            <SideCardLabel>Latency target</SideCardLabel>
            <SideCardValue>Sub 100 ms refresh</SideCardValue>
            <SideCardBody>Derived entirely from local mock timing windows.</SideCardBody>
          </SideCard>
          <SideCard>
            <SideCardLabel>Controls</SideCardLabel>
            <ControlRow>
              <Control>Replay</Control>
              <Control>Audio</Control>
              <Control>Clips</Control>
            </ControlRow>
          </SideCard>
        </SideStack>
      </ContentGrid>
    </Panel>
  )
}
