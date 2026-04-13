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
    <li ref={setNodeRef} style={style} className="rounded-md border border-[var(--rh-border)] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{team.displayName}</p>
          <p className="text-xs text-[var(--rh-muted)]">Priority #{team.priorityRank}</p>
        </div>
        <div className="flex gap-1">
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={onMoveUp} disabled={index === 0}>Up</button>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={onMoveDown} disabled={index === total - 1}>Down</button>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => onRemove(team.teamId)}>Remove</button>
          <button type="button" className="rounded border px-2 py-1 text-xs" {...attributes} {...listeners} aria-label={`Drag ${team.displayName}`}>Drag</button>
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
        <ul data-testid="config-team-list" className="space-y-2">
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
