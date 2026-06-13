import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NoteInput } from '../lib/types'

interface Props {
  onSave: (input: NoteInput) => Promise<{ error: string | null }>
}

/** Persistent "+" — drops a thought straight into Notes. Capture now, triage later. */
export default function QuickCapture({ onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setBusy(true)
    const firstLine = trimmed.split('\n')[0]
    const title = firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine
    const { error: err } = await onSave({ title, body: trimmed, is_markdown: false })
    setBusy(false)
    if (err) {
      setError(err)
    } else {
      setText('')
      setError(null)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick capture a note"
        className="fixed right-4 bottom-20 md:bottom-8 md:right-8 z-40 w-13 h-13 rounded-full bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-colors"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-800 rounded-xl p-4 space-y-3"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <textarea
              autoFocus
              required
              placeholder="Drop a thought… first line becomes the title"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
              >
                {busy ? 'Saving…' : 'Save to Notes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
