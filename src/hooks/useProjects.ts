import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Project, ProjectInput } from '../lib/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('archived_at', null)
      .order('sort_order')
      .order('name')
    if (!error) setProjects(data as Project[])
  }, [])

  useEffect(() => {
    // refresh only sets state after its awaits resolve, so no sync cascade here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  /** Quick-create by name only (used by the task form's inline project picker). */
  const addProject = useCallback(
    async (name: string) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ name, sort_order: projects.length })
        .select()
        .single()
      if (error) return { project: null, error: error.message }
      const project = data as Project
      setProjects((prev) => [...prev, project])
      return { project, error: null }
    },
    [projects.length]
  )

  /** Full create from the Projects tab form (image/deadline/status). */
  const addProjectFull = useCallback(
    async (input: ProjectInput) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...input, sort_order: projects.length })
        .select()
        .single()
      if (error) return { project: null, error: error.message }
      const project = data as Project
      setProjects((prev) => [...prev, project])
      return { project, error: null }
    },
    [projects.length]
  )

  const updateProject = useCallback(async (id: string, patch: Partial<ProjectInput>) => {
    const { data, error } = await supabase
      .from('projects')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) return { error: error.message }
    setProjects((prev) => prev.map((p) => (p.id === id ? (data as Project) : p)))
    return { error: null }
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    // FK is on delete set null, so tasks survive and fall back to "No project".
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) return { error: error.message }
    setProjects((prev) => prev.filter((p) => p.id !== id))
    return { error: null }
  }, [])

  /** Persist a new manual order. Optimistic; writes one sort_order per id. */
  const reorderProjects = useCallback(
    async (orderedIds: string[]) => {
      const byId = new Map(projects.map((p) => [p.id, p]))
      const reordered = orderedIds
        .map((id, i) => {
          const p = byId.get(id)
          return p ? { ...p, sort_order: i } : null
        })
        .filter((p): p is Project => p !== null)
      setProjects(reordered)
      await Promise.all(
        reordered.map((p) =>
          supabase.from('projects').update({ sort_order: p.sort_order }).eq('id', p.id)
        )
      )
    },
    [projects]
  )

  return {
    projects,
    refresh,
    addProject,
    addProjectFull,
    updateProject,
    deleteProject,
    reorderProjects,
  }
}
