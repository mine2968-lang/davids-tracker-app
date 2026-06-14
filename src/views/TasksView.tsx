import { useMemo, useState } from 'react'
import TaskForm from '../components/TaskForm'
import TaskItem from '../components/TaskItem'
import type { useProjects } from '../hooks/useProjects'
import type { useTasks } from '../hooks/useTasks'
import type { Task } from '../lib/types'

interface Props {
  tasksApi: ReturnType<typeof useTasks>
  projectsApi: ReturnType<typeof useProjects>
}

export default function TasksView({ tasksApi, projectsApi }: Props) {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = tasksApi
  const { projects, addProject } = projectsApi
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showDone, setShowDone] = useState(false)

  const filtered = useMemo(() => {
    let list = tasks
    if (projectFilter === 'none') list = list.filter((t) => !t.project_id)
    else if (projectFilter !== 'all') list = list.filter((t) => t.project_id === projectFilter)
    if (!showDone) list = list.filter((t) => t.status !== 'done')
    return list
  }, [tasks, projectFilter, showDone])

  const doneCount = tasks.filter((t) => t.status === 'done').length

  const toggleDone = (task: Task) =>
    updateTask(task.id, { status: task.status === 'done' ? 'not_started' : 'done' })

  const handleDelete = (task: Task) => {
    if (confirm(`Delete "${task.title}"?`)) deleteTask(task.id)
  }

  const filterChip = (value: string, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setProjectFilter(value)}
      className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
        projectFilter === value
          ? 'bg-indigo-500 text-white'
          : 'bg-slate-800 text-slate-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tasks</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true)
              setEditingId(null)
            }}
            className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            + New task
          </button>
        )}
      </div>

      {(projects.length > 0 || tasks.some((t) => !t.project_id)) && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterChip('all', 'All')}
          {projects.map((p) => filterChip(p.id, p.name))}
          {filterChip('none', 'No project')}
        </div>
      )}

      {adding && (
        <TaskForm
          projects={projects}
          onSubmit={async (input) => {
            const res = await addTask(input)
            if (!res.error) setAdding(false)
            return res
          }}
          onCancel={() => setAdding(false)}
          onCreateProject={addProject}
        />
      )}

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-2">
        {filtered.map((task) =>
          editingId === task.id ? (
            <TaskForm
              key={task.id}
              initial={task}
              projects={projects}
              onSubmit={async (input) => {
                const res = await updateTask(task.id, input)
                if (!res.error) setEditingId(null)
                return res
              }}
              onCancel={() => setEditingId(null)}
              onCreateProject={addProject}
            />
          ) : (
            <TaskItem
              key={task.id}
              task={task}
              projects={projects}
              onToggleDone={toggleDone}
              onEdit={(t) => {
                setEditingId(t.id)
                setAdding(false)
              }}
              onDelete={handleDelete}
            />
          )
        )}
      </div>

      {!loading && filtered.length === 0 && !adding && (
        <p className="text-slate-500 text-sm text-center py-8">
          No tasks here. Hit “+ New task” to add one.
        </p>
      )}

      {doneCount > 0 && (
        <button
          type="button"
          onClick={() => setShowDone(!showDone)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            {showDone ? (
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.5 9 7a12 12 0 0 1-2.2 3M6.2 6.2A12.6 12.6 0 0 0 3 12c0 2.5 4 7 9 7a9.6 9.6 0 0 0 3.4-.6" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
          {showDone ? 'Hide' : 'Show'} {doneCount} completed
        </button>
      )}
    </div>
  )
}
