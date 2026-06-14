import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useImageUpload } from '../hooks/useImageUpload'
import type { Project, ProjectInput, ProjectStatus } from '../lib/types'

interface Props {
  initial?: Project
  onSubmit: (input: ProjectInput) => Promise<{ error: string | null }>
  onCancel: () => void
}

const inputCls =
  'w-full min-w-0 appearance-none rounded-lg bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500'

export default function ProjectForm({ initial, onSubmit, onCancel }: Props) {
  const { uploading, uploadProjectImage } = useImageUpload()
  const [name, setName] = useState(initial?.name ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null)
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'not_started')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handlePickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.')
      return
    }
    setError(null)
    const { url, error: err } = await uploadProjectImage(file)
    if (err) setError(err)
    else setImageUrl(url)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error: err } = await onSubmit({
      name: name.trim(),
      image_url: imageUrl,
      deadline: deadline || null,
      status,
    })
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex gap-3 items-start">
        <label className="shrink-0 cursor-pointer">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="w-16 h-16 rounded-lg object-cover bg-slate-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-4.5-4.5L5 21" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handlePickImage} className="hidden" />
        </label>
        <div className="flex-1 min-w-0 space-y-2">
          <input
            autoFocus
            required
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
          <p className="text-[11px] text-slate-500">
            {uploading ? 'Uploading…' : imageUrl ? 'Tap the image to change it.' : 'Tap the box to add a photo.'}
          </p>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="block text-xs text-slate-400 mb-1">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="min-w-0">
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className={inputCls}
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || uploading}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
        >
          {busy ? 'Saving…' : initial ? 'Save' : 'Add project'}
        </button>
      </div>
    </form>
  )
}
