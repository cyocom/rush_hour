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
    <form data-testid="config-team-input" className="space-y-2" onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold" htmlFor="team-id">Team identifier</label>
      <div className="flex gap-2">
        <input
          id="team-id"
          value={teamId}
          onChange={(event) => setTeamId(event.target.value)}
          className="w-full rounded-md border border-[var(--rh-border)] bg-white px-3 py-2"
          placeholder="frc254"
        />
        <button
          type="submit"
          className="rounded-md bg-[var(--rh-primary)] px-4 py-2 text-sm font-semibold text-[var(--rh-primary-ink)]"
        >
          Add
        </button>
      </div>
      {error ? <p className="text-sm text-[var(--rh-primary)]">{error}</p> : null}
    </form>
  )
}
