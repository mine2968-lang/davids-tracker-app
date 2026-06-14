export type TaskStatus = 'not_started' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type GoalStatus = 'not_started' | 'in_progress' | 'done'
export type ProjectStatus = 'not_started' | 'in_progress' | 'done'

export interface Goal {
  id: string
  title: string
  deadline: string | null
  status: GoalStatus
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface GoalInput {
  title: string
  deadline: string | null
  status: GoalStatus
}

export interface Milestone {
  id: string
  goal_id: string
  title: string
  sort_order: number
  created_at: string
}

export interface Note {
  id: string
  title: string
  body: string
  is_markdown: boolean
  linked_goal_id: string | null
  linked_task_id: string | null
  folder_id: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface NoteInput {
  title: string
  body: string
  is_markdown: boolean
  linked_goal_id?: string | null
  linked_task_id?: string | null
  folder_id?: string | null
}

/** A folder groups a goal's linked notes. */
export interface NoteFolder {
  id: string
  goal_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

/** Joins one tag to exactly one of goal/task/note. */
export interface ItemTag {
  id: string
  tag_id: string
  goal_id: string | null
  task_id: string | null
  note_id: string | null
}

export interface Project {
  id: string
  name: string
  image_url: string | null
  deadline: string | null
  status: ProjectStatus
  sort_order: number
  archived_at: string | null
  created_at: string
}

export interface ProjectInput {
  name: string
  image_url: string | null
  deadline: string | null
  status: ProjectStatus
}

export interface Task {
  id: string
  title: string
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  goal_id: string | null
  milestone_id: string | null
  project_id: string | null
  sort_order: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** Fields the client supplies when creating/updating a task. */
export interface TaskInput {
  title: string
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  project_id: string | null
  goal_id?: string | null
  milestone_id?: string | null
  sort_order?: number
}

/** Progress % for a goal: completed tasks / all tasks under it. */
export function goalProgress(goalId: string, tasks: Task[]): { done: number; total: number; pct: number } {
  const under = tasks.filter((t) => t.goal_id === goalId)
  const done = under.filter((t) => t.status === 'done').length
  const total = under.length
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
}

/** Progress % for a project: completed tasks / all tasks in it. */
export function projectProgress(
  projectId: string,
  tasks: Task[]
): { done: number; total: number; pct: number } {
  const under = tasks.filter((t) => t.project_id === projectId)
  const done = under.filter((t) => t.status === 'done').length
  const total = under.length
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
}

/** Local YYYY-MM-DD (matches Postgres `date` column, avoids UTC off-by-one). */
export function todayStr(): string {
  return new Date().toLocaleDateString('en-CA')
}
