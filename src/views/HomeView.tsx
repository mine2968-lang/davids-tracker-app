import { useMemo } from 'react'
import ProgressBar from '../components/ProgressBar'
import TaskItem from '../components/TaskItem'
import type { useGoals } from '../hooks/useGoals'
import type { useProjects } from '../hooks/useProjects'
import type { useTasks } from '../hooks/useTasks'
import type { Task } from '../lib/types'
import { goalProgress, todayStr } from '../lib/types'

interface Props {
  tasksApi: ReturnType<typeof useTasks>
  projectsApi: ReturnType<typeof useProjects>
  goalsApi: ReturnType<typeof useGoals>
  onGoToTasks: () => void
  onGoToGoals: () => void
}

export default function HomeView({ tasksApi, projectsApi, goalsApi, onGoToTasks, onGoToGoals }: Props) {
  const { tasks, loading, updateTask, deleteTask } = tasksApi
  const { projects } = projectsApi
  const activeGoals = goalsApi.goals.filter((g) => g.status !== 'done')

  const today = todayStr()
  const { overdue, dueToday, upcoming } = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done' && t.due_date)
    return {
      overdue: open.filter((t) => t.due_date! < today),
      dueToday: open.filter((t) => t.due_date === today),
      upcoming: open
        .filter((t) => t.due_date! > today)
        .sort((a, b) => a.due_date!.localeCompare(b.due_date!)),
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
          {section('Upcoming', upcoming, 'text-emerald-300')}
          {overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0 && (
            <p className="text-slate-500 text-sm">All clear — nothing due.</p>
          )}

          {activeGoals.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 text-slate-300">Active goals</h3>
              <div className="space-y-2">
                {activeGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={onGoToGoals}
                    className="w-full text-left bg-slate-800 rounded-xl p-3 hover:bg-slate-700/80 transition-colors"
                  >
                    <p className="text-sm font-medium truncate mb-1.5">{goal.title}</p>
                    <ProgressBar {...goalProgress(goal.id, tasks)} />
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
