import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import ProgressBar from '../components/ProgressBar'
import ProjectForm from '../components/ProjectForm'
import Sortable from '../components/Sortable'
import TaskForm from '../components/TaskForm'
import TaskItem from '../components/TaskItem'
import type { useProjects } from '../hooks/useProjects'
import type { useTasks } from '../hooks/useTasks'
import type { Project, ProjectStatus, Task } from '../lib/types'
import { projectProgress } from '../lib/types'

interface Props {
  projectsApi: ReturnType<typeof useProjects>
  tasksApi: ReturnType<typeof useTasks>
}

const STATUS_BADGE: Record<ProjectStatus, { label: string; cls: string }> = {
  not_started: { label: 'Not started', cls: 'bg-slate-500/15 text-slate-400' },
  in_progress: { label: 'In progress', cls: 'bg-sky-500/15 text-sky-400' },
  done: { label: 'Done', cls: 'bg-emerald-500/15 text-emerald-400' },
}

function Thumb({ url, size }: { url: string | null; size: string }) {
  if (url) {
    return <img src={url} alt="" className={`${size} rounded-lg object-cover bg-slate-700 shrink-0`} />
  }
  return (
    <div className={`${size} rounded-lg bg-slate-700 flex items-center justify-center text-slate-500 shrink-0`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round" />
      </svg>
    </div>
  )
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

function ProjectList({ projectsApi, tasksApi, onOpen }: Props & { onOpen: (id: string) => void }) {
  const { projects, addProjectFull, reorderProjects } = projectsApi
  const [adding, setAdding] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = projects.map((p) => p.id)
    const next = arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string))
    reorderProjects(next)
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
        <ProjectForm
          onSubmit={async (input) => {
            const { error } = await addProjectFull(input)
            if (!error) setAdding(false)
            return { error }
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {projects.map((project) => {
              const progress = projectProgress(project.id, tasksApi.tasks)
              const badge = STATUS_BADGE[project.status]
              return (
                <Sortable key={project.id} id={project.id}>
                  {(handle) => (
                    <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-3">
                      {handle}
                      <button
                        type="button"
                        onClick={() => onOpen(project.id)}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left"
                      >
                        <Thumb url={project.image_url} size="w-12 h-12" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="font-medium truncate">{project.name}</p>
                            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          <ProgressBar {...progress} />
                          {project.deadline && (
                            <p className="text-xs text-slate-500 mt-1">Deadline: {project.deadline}</p>
                          )}
                        </div>
                      </button>
                    </div>
                  )}
                </Sortable>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

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
  const { tasks, addTask, updateTask, deleteTask, reorderTasks, refresh: refreshTasks } = tasksApi
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const projectTasks = tasks
    .filter((t) => t.project_id === project.id)
    .sort((a, b) => a.sort_order - b.sort_order)
  const openTasks = projectTasks.filter((t) => t.status !== 'done')
  const doneTasks = projectTasks.filter((t) => t.status === 'done')
  const progress = projectProgress(project.id, tasks)
  const badge = STATUS_BADGE[project.status]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    // Only open (non-completed) tasks are draggable; persist the full order
    // with completed tasks appended after them.
    const openIds = openTasks.map((t) => t.id)
    const next = arrayMove(openIds, openIds.indexOf(active.id as string), openIds.indexOf(over.id as string))
    reorderTasks([...next, ...doneTasks.map((t) => t.id)])
  }

  const toggleDone = (task: Task) =>
    updateTask(task.id, { status: task.status === 'done' ? 'not_started' : 'done' })

  const handleDeleteTask = (task: Task) => {
    if (confirm(`Delete "${task.title}"?`)) deleteTask(task.id)
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

  const renderTaskOrForm = (task: Task) =>
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

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        ← Projects
      </button>

      {editing ? (
        <ProjectForm
          initial={project}
          onSubmit={async (input) => {
            const { error } = await updateProject(project.id, input)
            if (!error) setEditing(false)
            return { error }
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Thumb url={project.image_url} size="w-16 h-16" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold min-w-0 truncate">{project.name}</h2>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                    aria-label="Edit project"
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
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                {project.deadline && (
                  <span className="text-xs text-slate-500">Deadline: {project.deadline}</span>
                )}
              </div>
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
            // Force this task into the open project; append to the end.
            const res = await addTask({ ...input, project_id: project.id, sort_order: projectTasks.length })
            if (!res.error) setAdding(false)
            return res
          }}
          onCancel={() => setAdding(false)}
          onCreateProject={addProject}
        />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={openTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {openTasks.map((task) =>
              editingTaskId === task.id ? (
                renderTaskOrForm(task)
              ) : (
                <Sortable key={task.id} id={task.id}>
                  {(handle) => (
                    <div className="flex items-center gap-1">
                      {handle}
                      <div className="flex-1 min-w-0">{renderTaskOrForm(task)}</div>
                    </div>
                  )}
                </Sortable>
              )
            )}
          </div>
        </SortableContext>
      </DndContext>

      {openTasks.length === 0 && !adding && (
        <p className="text-slate-500 text-sm text-center py-6">No tasks in this project yet.</p>
      )}

      {doneTasks.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowDone(!showDone)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            {showDone ? 'Hide' : 'Show'} {doneTasks.length} completed
          </button>
          {showDone && <div className="space-y-2">{doneTasks.map(renderTaskOrForm)}</div>}
        </>
      )}
    </div>
  )
}
