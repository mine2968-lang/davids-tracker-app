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
  const { tasks, loading, error, addTask, updateTask, deleteTask, refresh: refreshTasks } = tasksApi
  const { projects, addProject, deleteProject } = projectsApi
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showDone, setShowDone] = useState(false)
  const [managingProjects, setManagingProjects] = useState(false)

  const handleDeleteProject = async (id: string, name: string) => {
    const count = tasks.filter((t) => t.project_id === id).length
    const msg = count
      ? `Delete project "${name}"? Its ${count} task${count > 1 ? 's' : ''} stay but become "No project".`
      : `Delete project "${name}"?`
    if (!confirm(msg)) return
    const { error: err } = await deleteProject(id)
    if (!err) {
      if (projectFilter === id) setProjectFilter('all')
      // Tasks that referenced this project had project_id nulled server-side.
      refreshTasks()
    }
  }

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
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterChip('all', 'All')}
            {projects.map((p) => filterChip(p.id, p.name))}
            {filterChip('none', 'No project')}
          </div>
          {projects.length > 0 && (
            <button
              type="button"
              onClick={() => setManagingProjects((v) => !v)}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              {managingProjects ? 'Done managing' : 'Manage projects'}
            </button>
          )}
          {managingProjects && (
            <div className="space-y-1.5 bg-slate-800 rounded-xl p-3">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(p.id, p.name)}
                    className="shrink-0 text-xs text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
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
