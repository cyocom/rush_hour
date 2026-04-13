# Data Model: FIRST Robotics Watch Experience

## Entity: TrackedTeam
- `teamId` (string)
- `displayName` (string)
- `priorityRank` (integer)
- `createdAt` (ISO timestamp)

## Entity: MatchWindow
- `matchId` (string)
- `startTime` (ISO timestamp)
- `endTime` (ISO timestamp)
- `participantTeamIds` (string[])
- `label` (string)

## Entity: UpcomingMatchAlert
- `alertId` (string)
- `matchId` (string)
- `trackedTeamsInMatch` (string[])
- `startTime` (ISO timestamp)
- `urgency` (`upcoming` | `soon` | `now`)
- `priorityScore` (number)

## Entity: MatchConflict
- `conflictId` (string)
- `startTime` (ISO timestamp)
- `endTime` (ISO timestamp)
- `impactedMatchIds` (string[])
- `impactedTrackedTeams` (string[])
- `highestPriorityTeamId` (optional string)

## Entity: WatchSessionPreferences
- `trackedTeams` (`TrackedTeam[]`)
- `lastUpdatedAt` (ISO timestamp)
- `schemaVersion` (string)
