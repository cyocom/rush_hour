import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

interface PageShellProps {
  title: string
  subtitle: string
  immersive?: boolean
  children: ReactNode
}

const Shell = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 10%, rgb(150 29 55 / 0.22), transparent 24%),
    radial-gradient(circle at 85% 0%, rgb(255 184 0 / 0.08), transparent 22%),
    linear-gradient(180deg, #0b0d10 0%, #101216 52%, #12151b 100%);
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgb(255 255 255 / 0.02) 1px, transparent 1px),
    linear-gradient(rgb(255 255 255 / 0.02) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(180deg, rgb(0 0 0 / 0.55), transparent 92%);
`;

const Frame = styled.div`
  position: relative;
  z-index: 1;
  width: min(1440px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 32px;

  @media (max-width: 900px) {
    width: min(100vw - 20px, 100%);
    padding-top: 16px;
  }
`;

const ImmersiveFrame = styled.div`
  position: relative;
  z-index: 1;
  width: min(1840px, calc(100vw - 8px));
  margin: 0 auto;
  padding: 10px 0 20px;

  @media (max-width: 900px) {
    width: min(100vw - 10px, 100%);
    padding-top: 8px;
  }
`;

const AppGrid = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 24px;
  align-self: start;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: linear-gradient(180deg, rgb(19 21 27 / 0.98), rgb(14 16 21 / 0.94));
  color: white;
  border-radius: 32px;
  padding: 24px;
  box-shadow: 0 30px 70px rgb(0 0 0 / 0.28);

  @media (max-width: 1100px) {
    position: static;
  }
`;

const Brand = styled.div`
  padding-bottom: 20px;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
`;

const BrandKicker = styled.p`
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgb(255 221 228 / 0.75);
`;

const BrandTitle = styled.h2`
  margin: 14px 0 0;
  font-size: 29px;
  line-height: 0.95;
  letter-spacing: -0.06em;
  font-weight: 900;
`;

const BrandBody = styled.p`
  margin: 14px 0 0;
  color: rgb(235 235 240 / 0.68);
  line-height: 1.6;
  font-size: 14px;
`;

const SideNav = styled.nav`
  display: grid;
  gap: 10px;
  margin-top: 24px;
`;

const Main = styled.div`
  min-width: 0;
`;

const ImmersiveTopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: linear-gradient(180deg, rgb(19 21 27 / 0.96), rgb(14 16 21 / 0.94));
  color: white;
  border-radius: 20px;
  padding: 12px 16px;
  box-shadow: 0 20px 50px rgb(0 0 0 / 0.22);

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: start;
  }
`;

const ImmersiveBrand = styled.div`
  display: grid;
  gap: 4px;
`;

const ImmersiveKicker = styled.p`
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(255 221 228 / 0.7);
`;

const ImmersiveTitle = styled.p`
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.04em;
`;

const ImmersiveNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CompactNavLink = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.78);
  border: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(255 255 255 / 0.03);
  transition: 180ms ease;

  &:hover {
    color: white;
    background: rgb(255 255 255 / 0.07);
  }

  &.active {
    background: linear-gradient(135deg, rgb(150 29 55), rgb(184 48 82));
    color: white;
    border-color: rgb(255 255 255 / 0.12);
  }
`;

const Hero = styled.header`
  border: 1px solid rgb(255 255 255 / 0.08);
  background:
    radial-gradient(circle at top right, rgb(150 29 55 / 0.18), transparent 28%),
    linear-gradient(180deg, rgb(245 237 226 / 0.96), rgb(237 229 216 / 0.92));
  border-radius: 32px;
  padding: 28px;
  box-shadow: 0 30px 80px rgb(0 0 0 / 0.18);
`;

const HeroTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const HeroEyebrow = styled.p`
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgb(150 29 55);
`;

const HeroTitle = styled.h1`
  margin: 14px 0 0;
  font-size: clamp(3rem, 5vw, 5.25rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
  font-weight: 900;
  color: #0a0a0a;
`;

const HeroSubtitle = styled.p`
  margin: 18px 0 0;
  max-width: 760px;
  font-size: 18px;
  line-height: 1.65;
  color: rgb(79 75 69);
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 18px;
  padding: 14px 16px;
  color: rgb(255 255 255 / 0.78);
  border: 1px solid transparent;
  background: transparent;
  transition: 180ms ease;

  &:hover {
    background: rgb(255 255 255 / 0.05);
    border-color: rgb(255 255 255 / 0.08);
    color: white;
  }

  &.active {
    background: linear-gradient(135deg, rgb(150 29 55), rgb(184 48 82));
    border-color: rgb(255 255 255 / 0.08);
    color: white;
    box-shadow: 0 16px 32px rgb(150 29 55 / 0.3);
  }
`;

const NavLabelGroup = styled.div`
  display: grid;
  gap: 3px;
`;

const NavTitle = styled.span`
  font-size: 15px;
  font-weight: 800;
`;

const NavDescription = styled.span`
  font-size: 12px;
  color: currentColor;
  opacity: 0.72;
`;

const NavBadge = styled.span`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export function PageShell({ title, subtitle, immersive = false, children }: PageShellProps) {
  if (immersive) {
    return (
      <Shell>
        <Backdrop />
        <ImmersiveFrame>
          <ImmersiveTopBar>
            <ImmersiveBrand>
              <ImmersiveKicker>Rushhour Watchdesk</ImmersiveKicker>
              <ImmersiveTitle>{title}</ImmersiveTitle>
            </ImmersiveBrand>
            <ImmersiveNav aria-label="Primary">
              <CompactNavLink to="/watch">Watch</CompactNavLink>
              <CompactNavLink to="/config">Config</CompactNavLink>
              <CompactNavLink to="/schedule">Schedule</CompactNavLink>
            </ImmersiveNav>
          </ImmersiveTopBar>
          {children}
        </ImmersiveFrame>
      </Shell>
    )
  }

  return (
    <Shell>
      <Backdrop />
      <Frame>
        <AppGrid>
          <Sidebar>
            <Brand>
              <BrandKicker>Game day guide</BrandKicker>
              <BrandTitle>FRC match watch</BrandTitle>
              <BrandBody>
                Follow your favorite teams, keep an eye on the next matches, and spot schedule overlaps before they sneak up on you.
              </BrandBody>
            </Brand>

            <SideNav aria-label="Primary">
              <StyledNavLink to="/watch">
                <NavLabelGroup>
                  <NavTitle>Watch</NavTitle>
                  <NavDescription>See what is coming up next</NavDescription>
                </NavLabelGroup>
                <NavBadge>01</NavBadge>
              </StyledNavLink>
              <StyledNavLink to="/config">
                <NavLabelGroup>
                  <NavTitle>Config</NavTitle>
                  <NavDescription>Choose the teams you care about</NavDescription>
                </NavLabelGroup>
                <NavBadge>02</NavBadge>
              </StyledNavLink>
              <StyledNavLink to="/schedule">
                <NavLabelGroup>
                  <NavTitle>Schedule</NavTitle>
                  <NavDescription>Upcoming matches at a glance</NavDescription>
                </NavLabelGroup>
                <NavBadge>03</NavBadge>
              </StyledNavLink>
            </SideNav>
          </Sidebar>

          <Main>
            <Hero>
              <HeroTop>
                <div>
                  <HeroEyebrow>Rushhour Watchdesk</HeroEyebrow>
                  <HeroTitle>{title}</HeroTitle>
                  <HeroSubtitle>{subtitle}</HeroSubtitle>
                </div>
              </HeroTop>
            </Hero>
            {children}
          </Main>
        </AppGrid>
      </Frame>
    </Shell>
  )
}
