import type { ReactNode } from 'react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/** A drag handle (the dots) — only this grabs, so taps elsewhere still work. */
function DragHandle({
  attributes,
  listeners,
}: {
  attributes: DraggableAttributes
  listeners: SyntheticListenerMap | undefined
}) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      className="shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 text-slate-600 hover:text-slate-300 transition-colors"
      {...attributes}
      {...listeners}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </button>
  )
}

interface Props {
  id: string
  /** Render-prop receives the handle to place wherever it fits the row/card. */
  children: (handle: ReactNode) => ReactNode
}

/** Wraps a row/card so it can be dragged within a SortableContext. */
export default function Sortable({ id, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {children(<DragHandle attributes={attributes} listeners={listeners} />)}
    </div>
  )
}
