import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskInput } from '../lib/types'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('tasks')
      .select('*')
      .is('archived_at', null)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
    } else {
      setTasks(data as Task[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // refresh only sets state after its awaits resolve, so no sync cascade here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    // Cross-device sync stance for v1: refetch when the app regains focus.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const addTask = useCallback(async (input: TaskInput) => {
    const { data, error: err } = await supabase
      .from('tasks')
      .insert(input)
      .select()
      .single()
    if (err) return { task: null, error: err.message }
    const task = data as Task
    setTasks((prev) => [task, ...prev])
    return { task, error: null }
  }, [])

  const updateTask = useCallback(async (id: string, patch: Partial<TaskInput>) => {
    const { data, error: err } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (err) return { error: err.message }
    setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)))
    return { error: null }
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id)
    if (err) return { error: err.message }
    setTasks((prev) => prev.filter((t) => t.id !== id))
    return { error: null }
  }, [])

  return { tasks, loading, error, refresh, addTask, updateTask, deleteTask }
}
