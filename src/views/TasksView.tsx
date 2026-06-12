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
          className="text-xs text-slate-500 hover:text-white transition-colors"
        >
          {showDone ? 'Hide' : 'Show'} {doneCount} completed
        </button>
      )}
    </div>
  )
}
