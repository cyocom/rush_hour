import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TrackedTeam } from '../../domain/models/watch'

interface PriorityTeamListProps {
  teams: TrackedTeam[]
  onRemove: (teamId: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

interface SortableItemProps {
  team: TrackedTeam
  index: number
  total: number
  onRemove: (teamId: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function SortableTeamItem({ team, index, total, onRemove, onMoveUp, onMoveDown }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: team.teamId })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li ref={setNodeRef} style={style} className="rounded-[1.25rem] border border-[color:var(--rh-border)] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(150_29_55_/_10%)] text-sm font-black text-[color:var(--rh-primary)]">
            {team.priorityRank}
          </div>
          <div>
            <p className="text-base font-bold tracking-[-0.02em]">{team.displayName}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--rh-muted-soft)]">Priority #{team.priorityRank}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rh-button-secondary px-3 py-2 text-xs" onClick={onMoveUp} disabled={index === 0}>Up</button>
          <button type="button" className="rh-button-secondary px-3 py-2 text-xs" onClick={onMoveDown} disabled={index === total - 1}>Down</button>
          <button type="button" className="rh-button-secondary px-3 py-2 text-xs" onClick={() => onRemove(team.teamId)}>Remove</button>
          <button type="button" className="rh-button-secondary px-3 py-2 text-xs" {...attributes} {...listeners} aria-label={`Drag ${team.displayName}`}>Drag</button>
        </div>
      </div>
    </li>
  )
}

export function PriorityTeamList({ teams, onRemove, onReorder }: PriorityTeamListProps) {
  const sensors = useSensors(useSensor(PointerSensor))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event
        if (!over || active.id === over.id) {
          return
        }

        const oldIndex = teams.findIndex((team) => team.teamId === active.id)
        const newIndex = teams.findIndex((team) => team.teamId === over.id)

        if (oldIndex >= 0 && newIndex >= 0) {
          const moved = arrayMove(teams, oldIndex, newIndex)
          const movedIndex = moved.findIndex((team) => team.teamId === active.id)
          onReorder(oldIndex, movedIndex)
        }
      }}
    >
      <SortableContext items={teams.map((team) => team.teamId)} strategy={verticalListSortingStrategy}>
        <ul data-testid="config-team-list" className="space-y-3">
          {teams.map((team, index) => (
            <SortableTeamItem
              key={team.teamId}
              team={team}
              index={index}
              total={teams.length}
              onRemove={onRemove}
              onMoveUp={() => onReorder(index, index - 1)}
              onMoveDown={() => onReorder(index, index + 1)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
