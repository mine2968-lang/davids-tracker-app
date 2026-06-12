import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Goal, GoalInput, GoalStatus } from '../lib/types'

interface Props {
  initial?: Goal
  onSubmit: (input: GoalInput) => Promise<{ error: string | null }>
  onCancel: () => void
}

const inputCls =
  'w-full min-w-0 appearance-none rounded-lg bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500'

export default function GoalForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [status, setStatus] = useState<GoalStatus>(initial?.status ?? 'not_started')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error: err } = await onSubmit({
      title: title.trim(),
      deadline: deadline || null,
      status,
    })
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-4 space-y-3">
      <input
        autoFocus
        required
        placeholder="What's the goal?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputCls}
      />

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
            onChange={(e) => setStatus(e.target.value as GoalStatus)}
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
          disabled={busy}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
        >
          {busy ? 'Saving…' : initial ? 'Save' : 'Add goal'}
        </button>
      </div>
    </form>
  )
}
