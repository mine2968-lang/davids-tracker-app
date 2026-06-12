import { useState } from 'react'
import type { FormEvent } from 'react'
import GoalForm from '../components/GoalForm'
import ProgressBar from '../components/ProgressBar'
import TaskForm from '../components/TaskForm'
import TaskItem from '../components/TaskItem'
import type { useGoals } from '../hooks/useGoals'
import type { useProjects } from '../hooks/useProjects'
import type { useTasks } from '../hooks/useTasks'
import type { Goal, Milestone, Task } from '../lib/types'
import { goalProgress } from '../lib/types'

interface Props {
  goalsApi: ReturnType<typeof useGoals>
  tasksApi: ReturnType<typeof useTasks>
  projectsApi: ReturnType<typeof useProjects>
}

const STATUS_BADGE: Record<Goal['status'], { label: string; cls: string }> = {
  not_started: { label: 'Not started', cls: 'bg-slate-500/15 text-slate-400' },
  in_progress: { label: 'In progress', cls: 'bg-sky-500/15 text-sky-400' },
  done: { label: 'Done', cls: 'bg-emerald-500/15 text-emerald-400' },
}

export default function GoalsView({ goalsApi, tasksApi, projectsApi }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = goalsApi.goals.find((g) => g.id === selectedId)

  if (selected) {
    return (
      <GoalDetail
        goal={selected}
        goalsApi={goalsApi}
        tasksApi={tasksApi}
        projectsApi={projectsApi}
        onBack={() => setSelectedId(null)}
      />
    )
  }
  return <GoalList goalsApi={goalsApi} tasksApi={tasksApi} onOpen={setSelectedId} />
}

function GoalList({
  goalsApi,
  tasksApi,
  onOpen,
}: {
  goalsApi: ReturnType<typeof useGoals>
  tasksApi: ReturnType<typeof useTasks>
  onOpen: (id: string) => void
}) {
  const { goals, loading, error, addGoal } = goalsApi
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Goals</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            + New goal
          </button>
        )}
      </div>

      {adding && (
        <GoalForm
          onSubmit={async (input) => {
            const res = await addGoal(input)
            if (!res.error) setAdding(false)
            return res
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-2">
        {goals.map((goal) => {
          const progress = goalProgress(goal.id, tasksApi.tasks)
          const badge = STATUS_BADGE[goal.status]
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => onOpen(goal.id)}
              className="w-full text-left bg-slate-800 hover:bg-slate-700/80 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-medium truncate">{goal.title}</p>
                <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <ProgressBar {...progress} />
              {goal.deadline && (
                <p className="text-xs text-slate-500 mt-1.5">Deadline: {goal.deadline}</p>
              )}
            </button>
          )
        })}
      </div>

      {!loading && goals.length === 0 && !adding && (
        <p className="text-slate-500 text-sm text-center py-8">
          No goals yet. Hit “+ New goal” to set one.
        </p>
      )}
    </div>
  )
}

function GoalDetail({
  goal,
  goalsApi,
  tasksApi,
  projectsApi,
  onBack,
}: {
  goal: Goal
  goalsApi: ReturnType<typeof useGoals>
  tasksApi: ReturnType<typeof useTasks>
  projectsApi: ReturnType<typeof useProjects>
  onBack: () => void
}) {
  const { milestones, updateGoal, deleteGoal, addMilestone, renameMilestone, deleteMilestone } =
    goalsApi
  const { tasks, addTask, updateTask, deleteTask } = tasksApi
  const [editingGoal, setEditingGoal] = useState(false)
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [addingTaskUnder, setAddingTaskUnder] = useState<string | 'general' | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const goalMilestones = milestones.filter((m) => m.goal_id === goal.id)
  const goalTasks = tasks.filter((t) => t.goal_id === goal.id)
  const progress = goalProgress(goal.id, tasks)
  const badge = STATUS_BADGE[goal.status]

  const toggleDone = (task: Task) =>
    updateTask(task.id, { status: task.status === 'done' ? 'not_started' : 'done' })

  const handleDeleteTask = (task: Task) => {
    if (confirm(`Delete "${task.title}"?`)) deleteTask(task.id)
  }

  const handleDeleteGoal = async () => {
    if (
      confirm(
        `Delete goal "${goal.title}"? Its milestones go too. Tasks stay but lose the goal link.`
      )
    ) {
      const { error } = await deleteGoal(goal.id)
      if (!error) onBack()
    }
  }

  const submitMilestone = async (e: FormEvent) => {
    e.preventDefault()
    if (!milestoneTitle.trim()) return
    const { error } = await addMilestone(goal.id, milestoneTitle.trim())
    if (!error) {
      setMilestoneTitle('')
      setAddingMilestone(false)
    }
  }

  const taskList = (list: Task[]) => (
    <div className="space-y-2">
      {list.map((task) =>
        editingTaskId === task.id ? (
          <TaskForm
            key={task.id}
            initial={task}
            projects={projectsApi.projects}
            onSubmit={async (input) => {
              const res = await updateTask(task.id, input)
              if (!res.error) setEditingTaskId(null)
              return res
            }}
            onCancel={() => setEditingTaskId(null)}
            onCreateProject={projectsApi.addProject}
          />
        ) : (
          <TaskItem
            key={task.id}
            task={task}
            projects={projectsApi.projects}
            onToggleDone={toggleDone}
            onEdit={(t) => setEditingTaskId(t.id)}
            onDelete={handleDeleteTask}
          />
        )
      )}
    </div>
  )

  const addTaskButton = (key: string | 'general', milestoneId: string | null) =>
    addingTaskUnder === key ? (
      <TaskForm
        projects={projectsApi.projects}
        onSubmit={async (input) => {
          const res = await addTask({ ...input, goal_id: goal.id, milestone_id: milestoneId })
          if (!res.error) setAddingTaskUnder(null)
          return res
        }}
        onCancel={() => setAddingTaskUnder(null)}
        onCreateProject={projectsApi.addProject}
      />
    ) : (
      <button
        type="button"
        onClick={() => setAddingTaskUnder(key)}
        className="text-xs text-slate-500 hover:text-indigo-300 transition-colors"
      >
        + Add task
      </button>
    )

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        ← Goals
      </button>

      {editingGoal ? (
        <GoalForm
          initial={goal}
          onSubmit={async (input) => {
            const res = await updateGoal(goal.id, input)
            if (!res.error) setEditingGoal(false)
            return res
          }}
          onCancel={() => setEditingGoal(false)}
        />
      ) : (
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">{goal.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.cls}`}>
                  {badge.label}
                </span>
                {goal.deadline && (
                  <span className="text-xs text-slate-500">Deadline: {goal.deadline}</span>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setEditingGoal(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Edit goal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleDeleteGoal}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                aria-label="Delete goal"
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

      {goalMilestones.map((m) => (
        <MilestoneSection
          key={m.id}
          milestone={m}
          tasks={goalTasks.filter((t) => t.milestone_id === m.id)}
          taskList={taskList}
          addTaskButton={addTaskButton}
          onRename={renameMilestone}
          onDelete={(id) => {
            if (confirm(`Delete milestone "${m.title}"? Its tasks stay under the goal.`))
              deleteMilestone(id)
          }}
        />
      ))}

      {addingMilestone ? (
        <form onSubmit={submitMilestone} className="bg-slate-800 rounded-xl p-3 flex gap-2">
          <input
            autoFocus
            required
            placeholder="Milestone name (e.g. Phase 1)"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            className="flex-1 rounded-lg bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-2 text-sm font-medium transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setAddingMilestone(false)}
            className="rounded-lg px-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddingMilestone(true)}
          className="text-sm text-slate-400 hover:text-indigo-300 transition-colors"
        >
          + Add milestone
        </button>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300">
          General tasks <span className="text-slate-500 font-normal">(no milestone)</span>
        </h3>
        {taskList(goalTasks.filter((t) => !t.milestone_id))}
        {addTaskButton('general', null)}
      </section>
    </div>
  )
}

function MilestoneSection({
  milestone,
  tasks,
  taskList,
  addTaskButton,
  onRename,
  onDelete,
}: {
  milestone: Milestone
  tasks: Task[]
  taskList: (list: Task[]) => React.ReactNode
  addTaskButton: (key: string, milestoneId: string | null) => React.ReactNode
  onRename: (id: string, title: string) => Promise<{ error: string | null }>
  onDelete: (id: string) => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(milestone.title)
  const done = tasks.filter((t) => t.status === 'done').length

  const submitRename = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const { error } = await onRename(milestone.id, title.trim())
    if (!error) setRenaming(false)
  }

  return (
    <section className="space-y-2">
      {renaming ? (
        <form onSubmit={submitRename} className="flex gap-2">
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-lg bg-slate-700 text-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="text-sm text-indigo-400 hover:text-indigo-300">
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setRenaming(false)
              setTitle(milestone.title)
            }}
            className="text-sm text-slate-500 hover:text-white"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2 group">
          <h3 className="text-sm font-semibold text-indigo-300">{milestone.title}</h3>
          <span className="text-xs text-slate-500">
            {tasks.length === 0 ? 'no tasks' : `${done}/${tasks.length}`}
          </span>
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="text-xs text-slate-600 hover:text-white transition-colors"
          >
            rename
          </button>
          <button
            type="button"
            onClick={() => onDelete(milestone.id)}
            className="text-xs text-slate-600 hover:text-red-400 transition-colors"
          >
            delete
          </button>
        </div>
      )}
      {taskList(tasks)}
      {addTaskButton(milestone.id, milestone.id)}
    </section>
  )
}
