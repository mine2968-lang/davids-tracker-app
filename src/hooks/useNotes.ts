import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Note, NoteInput } from '../lib/types'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('notes')
      .select('*')
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
    if (err) {
      setError(err.message)
    } else {
      setNotes(data as Note[])
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

  const addNote = useCallback(async (input: NoteInput) => {
    const { data, error: err } = await supabase.from('notes').insert(input).select().single()
    if (err) return { note: null, error: err.message }
    const note = data as Note
    setNotes((prev) => [note, ...prev])
    return { note, error: null }
  }, [])

  const updateNote = useCallback(async (id: string, patch: Partial<NoteInput>) => {
    const { data, error: err } = await supabase
      .from('notes')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (err) return { note: null, error: err.message }
    const note = data as Note
    setNotes((prev) => prev.map((n) => (n.id === id ? note : n)))
    return { note, error: null }
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('notes').delete().eq('id', id)
    if (err) return { error: err.message }
    setNotes((prev) => prev.filter((n) => n.id !== id))
    return { error: null }
  }, [])

  return { notes, loading, error, refresh, addNote, updateNote, deleteNote }
}
