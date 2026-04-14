import type { ReactNode } from 'react'
import styled from 'styled-components'

interface StatusCardProps {
  title: string
  body: string
  action?: ReactNode
}

const Card = styled.section`
  border-radius: 28px;
  border: 1px dashed rgb(206 195 181);
  background: linear-gradient(180deg, rgb(248 242 234 / 0.96), rgb(243 236 227 / 0.92));
  padding: 24px;
  box-shadow: 0 18px 50px rgb(20 18 16 / 0.08);
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const Icon = styled.div`
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgb(150 29 55 / 0.1);
  color: rgb(150 29 55);
  font-size: 24px;
  font-weight: 900;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  line-height: 1.05;
  letter-spacing: -0.04em;
  font-weight: 900;
  color: #0a0a0a;
`;

const Body = styled.p`
  margin: 12px 0 0;
  max-width: 44ch;
  font-size: 17px;
  line-height: 1.7;
  color: rgb(79 75 69);
`;

const Action = styled.div`
  margin-top: 18px;
`;

export function StatusCard({ title, body, action }: StatusCardProps) {
  return (
    <Card aria-live="polite">
      <Row>
        <Icon>i</Icon>
        <div>
          <Title>{title}</Title>
          <Body>{body}</Body>
          {action ? <Action>{action}</Action> : null}
        </div>
      </Row>
    </Card>
  )
}
