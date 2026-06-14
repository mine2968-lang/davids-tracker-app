import { useState } from 'react'
import type { FormEvent } from 'react'
import ProgressBar from '../components/ProgressBar'
import TaskForm from '../components/TaskForm'
import TaskItem from '../components/TaskItem'
import type { useProjects } from '../hooks/useProjects'
import type { useTasks } from '../hooks/useTasks'
import type { Project, Task } from '../lib/types'

interface Props {
  projectsApi: ReturnType<typeof useProjects>
  tasksApi: ReturnType<typeof useTasks>
}

/** Done/total for the open (non-archived) tasks in a project. */
function projectProgress(projectId: string, tasks: Task[]) {
  const under = tasks.filter((t) => t.project_id === projectId)
  const done = under.filter((t) => t.status === 'done').length
  const total = under.length
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
}

export default function ProjectsView({ projectsApi, tasksApi }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = projectsApi.projects.find((p) => p.id === selectedId)

  if (selected) {
    return (
      <ProjectDetail
        project={selected}
        projectsApi={projectsApi}
        tasksApi={tasksApi}
        onBack={() => setSelectedId(null)}
      />
    )
  }
  return <ProjectList projectsApi={projectsApi} tasksApi={tasksApi} onOpen={setSelectedId} />
}

function ProjectList({
  projectsApi,
  tasksApi,
  onOpen,
}: Props & { onOpen: (id: string) => void }) {
  const { projects, addProject } = projectsApi
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const { error: err } = await addProject(name.trim())
    if (err) {
      setError(err)
    } else {
      setName('')
      setAdding(false)
      setError(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Projects</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            + New project
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={submit} className="bg-slate-800 rounded-xl p-3 flex gap-2">
          <input
            autoFocus
            required
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-0 rounded-lg bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-2 text-sm font-medium transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false)
              setError(null)
            }}
            className="rounded-lg px-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </form>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-2">
        {projects.map((project) => {
          const progress = projectProgress(project.id, tasksApi.tasks)
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpen(project.id)}
              className="w-full text-left bg-slate-800 hover:bg-slate-700/80 rounded-xl p-4 transition-colors"
            >
              <p className="font-medium truncate mb-2">{project.name}</p>
              <ProgressBar {...progress} />
            </button>
          )
        })}
      </div>

      {projects.length === 0 && !adding && (
        <p className="text-slate-500 text-sm text-center py-8">
          No projects yet. “+ New project” to group your tasks.
        </p>
      )}
    </div>
  )
}

function ProjectDetail({
  project,
  projectsApi,
  tasksApi,
  onBack,
}: {
  project: Project
  projectsApi: ReturnType<typeof useProjects>
  tasksApi: ReturnType<typeof useTasks>
  onBack: () => void
}) {
  const { projects, addProject, updateProject, deleteProject } = projectsApi
  const { tasks, addTask, updateTask, deleteTask, refresh: refreshTasks } = tasksApi
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(project.name)
  const [adding, setAdding] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const projectTasks = tasks.filter((t) => t.project_id === project.id)
  const visibleTasks = showDone ? projectTasks : projectTasks.filter((t) => t.status !== 'done')
  const doneCount = projectTasks.filter((t) => t.status === 'done').length
  const progress = projectProgress(project.id, tasks)

  const toggleDone = (task: Task) =>
    updateTask(task.id, { status: task.status === 'done' ? 'not_started' : 'done' })

  const handleDeleteTask = (task: Task) => {
    if (confirm(`Delete "${task.title}"?`)) deleteTask(task.id)
  }

  const submitRename = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const { error } = await updateProject(project.id, name.trim())
    if (!error) setRenaming(false)
  }

  const handleDeleteProject = async () => {
    const count = projectTasks.length
    const msg = count
      ? `Delete project "${project.name}"? Its ${count} task${count > 1 ? 's' : ''} stay but become "No project".`
      : `Delete project "${project.name}"?`
    if (!confirm(msg)) return
    const { error } = await deleteProject(project.id)
    if (!error) {
      refreshTasks() // project_id nulled server-side
      onBack()
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        ← Projects
      </button>

      {renaming ? (
        <form onSubmit={submitRename} className="bg-slate-800 rounded-xl p-3 flex gap-2">
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-0 rounded-lg bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="text-sm text-indigo-400 hover:text-indigo-300">
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setRenaming(false)
              setName(project.name)
            }}
            className="text-sm text-slate-500 hover:text-white"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold min-w-0 truncate">{project.name}</h2>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setRenaming(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Rename project"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                aria-label="Delete project"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar {...progress} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Tasks</h3>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true)
              setEditingTaskId(null)
            }}
            className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            + Add task
          </button>
        )}
      </div>

      {adding && (
        <TaskForm
          projects={projects}
          onSubmit={async (input) => {
            // Force this task into the open project regardless of the form's picker.
            const res = await addTask({ ...input, project_id: project.id })
            if (!res.error) setAdding(false)
            return res
          }}
          onCancel={() => setAdding(false)}
          onCreateProject={addProject}
        />
      )}

      <div className="space-y-2">
        {visibleTasks.map((task) =>
          editingTaskId === task.id ? (
            <TaskForm
              key={task.id}
              initial={task}
              projects={projects}
              onSubmit={async (input) => {
                const res = await updateTask(task.id, input)
                if (!res.error) setEditingTaskId(null)
                return res
              }}
              onCancel={() => setEditingTaskId(null)}
              onCreateProject={addProject}
            />
          ) : (
            <TaskItem
              key={task.id}
              task={task}
              projects={projects}
              onToggleDone={toggleDone}
              onEdit={(t) => {
                setEditingTaskId(t.id)
                setAdding(false)
              }}
              onDelete={handleDeleteTask}
            />
          )
        )}
      </div>

      {visibleTasks.length === 0 && !adding && (
        <p className="text-slate-500 text-sm text-center py-6">
          No tasks in this project yet.
        </p>
      )}

      {doneCount > 0 && (
        <button
          type="button"
          onClick={() => setShowDone(!showDone)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          {showDone ? 'Hide' : 'Show'} {doneCount} completed
        </button>
      )}
    </div>
  )
}
