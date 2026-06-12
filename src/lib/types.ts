export type TaskStatus = 'not_started' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Project {
  id: string
  name: string
  archived_at: string | null
  created_at: string
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
}

/** Local YYYY-MM-DD (matches Postgres `date` column, avoids UTC off-by-one). */
export function todayStr(): string {
  return new Date().toLocaleDateString('en-CA')
}
