import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Project, Task, TaskInput, TaskPriority, TaskStatus } from '../lib/types'

interface Props {
  initial?: Task
  projects: Project[]
  onSubmit: (input: TaskInput) => Promise<{ error: string | null }>
  onCancel: () => void
  onCreateProject: (name: string) => Promise<{ project: Project | null; error: string | null }>
}

const inputCls =
  'w-full rounded-lg bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500'

export default function TaskForm({ initial, projects, onSubmit, onCancel, onCreateProject }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '')
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'medium')
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'not_started')
  const [projectId, setProjectId] = useState(initial?.project_id ?? '')
  const [newProjectName, setNewProjectName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)

    let finalProjectId: string | null = projectId || null
    if (projectId === '__new__') {
      if (!newProjectName.trim()) {
        setError('Give the new project a name.')
        setBusy(false)
        return
      }
      const { project, error: pErr } = await onCreateProject(newProjectName.trim())
      if (pErr || !project) {
        setError(pErr ?? 'Could not create project.')
        setBusy(false)
        return
      }
      finalProjectId = project.id
    }

    const { error: err } = await onSubmit({
      title: title.trim(),
      due_date: dueDate || null,
      priority,
      status,
      project_id: finalProjectId,
    })
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-4 space-y-3">
      <input
        autoFocus
        required
        placeholder="What needs doing?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputCls}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className={inputCls}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className={inputCls}
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Project</label>
          <select
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value)}
            className={inputCls}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="__new__">+ New project…</option>
          </select>
        </div>
      </div>

      {projectId === '__new__' && (
        <input
          placeholder="New project name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className={inputCls}
        />
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
        >
          {busy ? 'Saving…' : initial ? 'Save' : 'Add task'}
        </button>
      </div>
    </form>
  )
}
