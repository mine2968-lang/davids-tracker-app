import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Goal, GoalInput, Milestone, NoteFolder } from '../lib/types'

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [folders, setFolders] = useState<NoteFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [goalsRes, milestonesRes, foldersRes] = await Promise.all([
      supabase
        .from('goals')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('milestones').select('*').order('sort_order').order('created_at'),
      supabase.from('note_folders').select('*').order('sort_order').order('created_at'),
    ])
    if (goalsRes.error || milestonesRes.error) {
      setError(goalsRes.error?.message ?? milestonesRes.error?.message ?? null)
    } else {
      setGoals(goalsRes.data as Goal[])
      setMilestones(milestonesRes.data as Milestone[])
      if (!foldersRes.error) setFolders(foldersRes.data as NoteFolder[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // refresh only sets state after its awaits resolve, so no sync cascade here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const addGoal = useCallback(async (input: GoalInput) => {
    const { data, error: err } = await supabase.from('goals').insert(input).select().single()
    if (err) return { goal: null, error: err.message }
    const goal = data as Goal
    setGoals((prev) => [goal, ...prev])
    return { goal, error: null }
  }, [])

  const updateGoal = useCallback(async (id: string, patch: Partial<GoalInput>) => {
    const { data, error: err } = await supabase
      .from('goals')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (err) return { error: err.message }
    setGoals((prev) => prev.map((g) => (g.id === id ? (data as Goal) : g)))
    return { error: null }
  }, [])

  const deleteGoal = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('goals').delete().eq('id', id)
    if (err) return { error: err.message }
    setGoals((prev) => prev.filter((g) => g.id !== id))
    setMilestones((prev) => prev.filter((m) => m.goal_id !== id))
    return { error: null }
  }, [])

  const addMilestone = useCallback(
    async (goalId: string, title: string) => {
      const sortOrder = milestones.filter((m) => m.goal_id === goalId).length
      const { data, error: err } = await supabase
        .from('milestones')
        .insert({ goal_id: goalId, title, sort_order: sortOrder })
        .select()
        .single()
      if (err) return { error: err.message }
      setMilestones((prev) => [...prev, data as Milestone])
      return { error: null }
    },
    [milestones]
  )

  const renameMilestone = useCallback(async (id: string, title: string) => {
    const { data, error: err } = await supabase
      .from('milestones')
      .update({ title })
      .eq('id', id)
      .select()
      .single()
    if (err) return { error: err.message }
    setMilestones((prev) => prev.map((m) => (m.id === id ? (data as Milestone) : m)))
    return { error: null }
  }, [])

  const deleteMilestone = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('milestones').delete().eq('id', id)
    if (err) return { error: err.message }
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    return { error: null }
  }, [])

  const addFolder = useCallback(
    async (goalId: string, name: string) => {
      const sortOrder = folders.filter((f) => f.goal_id === goalId).length
      const { data, error: err } = await supabase
        .from('note_folders')
        .insert({ goal_id: goalId, name, sort_order: sortOrder })
        .select()
        .single()
      if (err) return { folder: null, error: err.message }
      const folder = data as NoteFolder
      setFolders((prev) => [...prev, folder])
      return { folder, error: null }
    },
    [folders]
  )

  const renameFolder = useCallback(async (id: string, name: string) => {
    const { data, error: err } = await supabase
      .from('note_folders')
      .update({ name })
      .eq('id', id)
      .select()
      .single()
    if (err) return { error: err.message }
    setFolders((prev) => prev.map((f) => (f.id === id ? (data as NoteFolder) : f)))
    return { error: null }
  }, [])

  const deleteFolder = useCallback(async (id: string) => {
    // FK is on delete set null, so notes survive and fall back to "no folder".
    const { error: err } = await supabase.from('note_folders').delete().eq('id', id)
    if (err) return { error: err.message }
    setFolders((prev) => prev.filter((f) => f.id !== id))
    return { error: null }
  }, [])

  return {
    goals,
    milestones,
    folders,
    loading,
    error,
    refresh,
    addGoal,
    updateGoal,
    deleteGoal,
    addMilestone,
    renameMilestone,
    deleteMilestone,
    addFolder,
    renameFolder,
    deleteFolder,
  }
}
