import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Project } from '../lib/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('archived_at', null)
      .order('name')
    if (!error) setProjects(data as Project[])
  }, [])

  useEffect(() => {
    // refresh only sets state after its awaits resolve, so no sync cascade here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  const addProject = useCallback(async (name: string) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name })
      .select()
      .single()
    if (error) return { project: null, error: error.message }
    const project = data as Project
    setProjects((prev) => [...prev, project].sort((a, b) => a.name.localeCompare(b.name)))
    return { project, error: null }
  }, [])

  const updateProject = useCallback(async (id: string, name: string) => {
    const { data, error } = await supabase
      .from('projects')
      .update({ name })
      .eq('id', id)
      .select()
      .single()
    if (error) return { error: error.message }
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? (data as Project) : p)).sort((a, b) => a.name.localeCompare(b.name))
    )
    return { error: null }
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    // FK is on delete set null, so tasks survive and fall back to "No project".
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) return { error: error.message }
    setProjects((prev) => prev.filter((p) => p.id !== id))
    return { error: null }
  }, [])

  return { projects, refresh, addProject, updateProject, deleteProject }
}
