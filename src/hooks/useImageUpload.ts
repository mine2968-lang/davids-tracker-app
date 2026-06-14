import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'project-images'

/** Uploads project images to {user_id}/{uuid}.{ext}; returns a public URL. */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false)

  const uploadProjectImage = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) return { url: null, error: 'Not signed in.' }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })
      if (error) return { url: null, error: error.message }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      return { url: data.publicUrl, error: null }
    } finally {
      setUploading(false)
    }
  }, [])

  /** Best-effort delete (e.g. when replacing an image). Ignores failures. */
  const removeProjectImage = useCallback(async (url: string) => {
    const marker = `/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const path = url.slice(idx + marker.length)
    await supabase.storage.from(BUCKET).remove([path])
  }, [])

  return { uploading, uploadProjectImage, removeProjectImage }
}
