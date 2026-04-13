import { useState } from 'react'
import type { FormEvent } from 'react'

interface TeamInputFormProps {
  error: string | null
  onSubmit: (teamId: string) => void
}

export function TeamInputForm({ error, onSubmit }: TeamInputFormProps) {
  const [teamId, setTeamId] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(teamId)
    if (!error) {
      setTeamId('')
    }
  }

  return (
    <form data-testid="config-team-input" className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <label className="block text-sm font-semibold" htmlFor="team-id">Team identifier</label>
        <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--rh-muted-soft)]">Session-scoped priority feed</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="team-id"
          value={teamId}
          onChange={(event) => setTeamId(event.target.value)}
          className="rh-input"
          placeholder="frc254"
        />
        <button
          type="submit"
          className="rh-button-primary shrink-0"
        >
          Add
        </button>
      </div>
      {error ? <p className="text-sm font-medium text-[var(--rh-primary)]">{error}</p> : null}
    </form>
  )
}
