import { useMemo } from 'react'
import TaskItem from '../components/TaskItem'
import type { useProjects } from '../hooks/useProjects'
import type { useTasks } from '../hooks/useTasks'
import type { Task } from '../lib/types'
import { todayStr } from '../lib/types'

interface Props {
  tasksApi: ReturnType<typeof useTasks>
  projectsApi: ReturnType<typeof useProjects>
  onGoToTasks: () => void
}

export default function HomeView({ tasksApi, projectsApi, onGoToTasks }: Props) {
  const { tasks, loading, updateTask, deleteTask } = tasksApi
  const { projects } = projectsApi

  const today = todayStr()
  const { overdue, dueToday } = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done' && t.due_date)
    return {
      overdue: open.filter((t) => t.due_date! < today),
      dueToday: open.filter((t) => t.due_date === today),
    }
  }, [tasks, today])

  const toggleDone = (task: Task) =>
    updateTask(task.id, { status: task.status === 'done' ? 'not_started' : 'done' })

  const handleDelete = (task: Task) => {
    if (confirm(`Delete "${task.title}"?`)) deleteTask(task.id)
  }

  const section = (title: string, list: Task[], accent: string) => (
    <section>
      <h3 className={`text-sm font-semibold mb-2 ${accent}`}>
        {title} <span className="text-slate-500 font-normal">({list.length})</span>
      </h3>
      {list.length === 0 ? (
        <p className="text-slate-600 text-sm">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {list.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              projects={projects}
              onToggleDone={toggleDone}
              onEdit={onGoToTasks}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Home</h2>
      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : (
        <>
          {section('Overdue', overdue, 'text-red-400')}
          {section('Due today', dueToday, 'text-indigo-300')}
          {overdue.length === 0 && dueToday.length === 0 && (
            <p className="text-slate-500 text-sm">
              All clear. Goals with progress bars land here in Phase 2.
            </p>
          )}
        </>
      )}
    </div>
  )
}
