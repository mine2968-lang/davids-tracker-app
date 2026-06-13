import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ItemTag, Tag } from '../lib/types'

/** Which column on item_tags an item kind uses. */
export type TaggableKind = 'goal_id' | 'task_id' | 'note_id'

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [itemTags, setItemTags] = useState<ItemTag[]>([])

  const refresh = useCallback(async () => {
    const [tagsRes, itemTagsRes] = await Promise.all([
      supabase.from('tags').select('*').order('name'),
      supabase.from('item_tags').select('*'),
    ])
    if (!tagsRes.error) setTags(tagsRes.data as Tag[])
    if (!itemTagsRes.error) setItemTags(itemTagsRes.data as ItemTag[])
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

  /** Find a tag by name (case-insensitive) or create it. */
  const getOrCreateTag = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
      if (existing) return { tag: existing, error: null }
      const { data, error } = await supabase.from('tags').insert({ name: trimmed }).select().single()
      if (error) return { tag: null, error: error.message }
      const tag = data as Tag
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      return { tag, error: null }
    },
    [tags]
  )

  const attachTag = useCallback(async (tagId: string, kind: TaggableKind, itemId: string) => {
    const { data, error } = await supabase
      .from('item_tags')
      .insert({ tag_id: tagId, [kind]: itemId })
      .select()
      .single()
    if (error) {
      // duplicate attach (unique constraint) is a no-op, not an error worth surfacing
      if (error.code === '23505') return { error: null }
      return { error: error.message }
    }
    setItemTags((prev) => [...prev, data as ItemTag])
    return { error: null }
  }, [])

  const detachTag = useCallback(async (itemTagId: string) => {
    const { error } = await supabase.from('item_tags').delete().eq('id', itemTagId)
    if (error) return { error: error.message }
    setItemTags((prev) => prev.filter((it) => it.id !== itemTagId))
    return { error: null }
  }, [])

  /** Tags attached to a given item, with the join row id for detaching. */
  const tagsFor = useCallback(
    (kind: TaggableKind, itemId: string) =>
      itemTags
        .filter((it) => it[kind] === itemId)
        .map((it) => ({ itemTagId: it.id, tag: tags.find((t) => t.id === it.tag_id) }))
        .filter((x): x is { itemTagId: string; tag: Tag } => !!x.tag),
    [itemTags, tags]
  )

  return { tags, itemTags, refresh, getOrCreateTag, attachTag, detachTag, tagsFor }
}
