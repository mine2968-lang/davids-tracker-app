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

  return { projects, refresh, addProject }
}
