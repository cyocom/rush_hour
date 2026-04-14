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
  padding: 18px;
  box-shadow: 0 34px 80px rgb(0 0 0 / 0.3);
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 760px) {
    flex-direction: column;
  }
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
  gap: 18px;
  margin-top: 14px;
`;

const Player = styled.div`
  position: relative;
  overflow: hidden;
  min-height: clamp(560px, 74vh, 920px);
  border-radius: 28px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background:
    radial-gradient(circle at top, rgb(114 19 46 / 0.24), transparent 34%),
    linear-gradient(180deg, #241724 0%, #15161d 42%, #090b0f 100%);

  @media (max-width: 1100px) {
    min-height: 64vh;
  }

  @media (max-width: 760px) {
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

const SideStack = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
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

export function MockStreamPanel() {
  return (
    <Panel data-testid="watch-stream-panel" aria-label="Live stream panel">
      <TopRow>
        <div>
          <Kicker>Now watching</Kicker>
          <Title>67 - MICMP - Hemlock Division - QM 1</Title>
        </div>
        <LiveBadge>Live look</LiveBadge>
      </TopRow>

      <ContentGrid>
        <Player>
          <Scanlines />
          <Crosshair>
            <PlayButton />
          </Crosshair>
          <BottomBar>
            <div>
              <DeckLabel>On deck</DeckLabel>
              <DeckTitle>1114</DeckTitle>
            </div>
          </BottomBar>
        </Player>

        <SideStack>
          <SideCard>
            <SideCardLabel>Coming up in 7 minutes</SideCardLabel>
            <SideCardValue>1114</SideCardValue>
            <SideCardBody>ONTCMP - Technology Division - QM10</SideCardBody>
          </SideCard>
          <SideCard>
            <SideCardLabel>Coming up in 14 minutes</SideCardLabel>
            <SideCardValue>3538</SideCardValue>
            <SideCardBody>MICMP - DTE Division - QM2</SideCardBody>
          </SideCard>
          <SideCard>
            <SideCardLabel>Coming up in 21 minutes</SideCardLabel>
            <SideCardValue>33</SideCardValue>
            <SideCardBody>MICMP - Consumers Energy Division - QM7</SideCardBody>
          </SideCard>
        </SideStack>
      </ContentGrid>
    </Panel>
  )
}
