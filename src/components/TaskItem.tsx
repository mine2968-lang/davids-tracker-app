import type { Project, Task } from '../lib/types'
import { todayStr } from '../lib/types'

interface Props {
  task: Task
  projects: Project[]
  onToggleDone: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  high: 'bg-red-500/15 text-red-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-slate-500/15 text-slate-400',
}

function dueLabel(due: string | null): { text: string; overdue: boolean } | null {
  if (!due) return null
  const today = todayStr()
  if (due < today) return { text: `Overdue · ${due}`, overdue: true }
  if (due === today) return { text: 'Today', overdue: false }
  return { text: due, overdue: false }
}

export default function TaskItem({ task, projects, onToggleDone, onEdit, onDelete }: Props) {
  const done = task.status === 'done'
  const due = dueLabel(task.due_date)
  const project = projects.find((p) => p.id === task.project_id)

  return (
    <div className="group flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
      <button
        type="button"
        onClick={() => onToggleDone(task)}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500 hover:border-indigo-400'
        }`}
      >
        {done && (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm truncate ${done ? 'line-through text-slate-500' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {due && !done && (
            <span className={`text-xs ${due.overdue ? 'text-red-400' : 'text-slate-400'}`}>
              {due.text}
            </span>
          )}
          {task.status === 'in_progress' && (
            <span className="text-xs text-sky-400">In progress</span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
          {project && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
              {project.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label="Delete task"
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
