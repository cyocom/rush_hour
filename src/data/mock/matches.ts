import { addMinutes } from 'date-fns'
import type { MatchWindow } from '../../domain/models/watch'

const base = new Date()

function windowFromOffset(matchId: string, label: string, offsetMinutes: number, durationMinutes: number, participants: string[]): MatchWindow {
  const start = addMinutes(base, offsetMinutes)
  const end = addMinutes(start, durationMinutes)

  return {
    matchId,
    label,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    participantTeamIds: participants,
  }
}

export const MOCK_MATCH_WINDOWS: MatchWindow[] = [
  windowFromOffset('qm-01', 'Qualification 1', 5, 20, ['frc254', 'frc1114', 'frc1678', 'frc118']),
  windowFromOffset('qm-02', 'Qualification 2', 15, 20, ['frc2056', 'frc973', 'frc971', 'frc4414']),
  windowFromOffset('qm-03', 'Qualification 3', 28, 18, ['frc1678', 'frc148', 'frc1323', 'frc33']),
  windowFromOffset('qm-04', 'Qualification 4', 42, 16, ['frc1114', 'frc118', 'frc2056', 'frc604']),
  windowFromOffset('qm-05', 'Qualification 5', 61, 16, ['frc254', 'frc971', 'frc16', 'frc4414']),
]

export function loadMockMatchWindows(): MatchWindow[] {
  return [...MOCK_MATCH_WINDOWS]
}
