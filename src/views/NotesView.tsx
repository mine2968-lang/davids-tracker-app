import { useState } from 'react'
import type { FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import type { useGoals } from '../hooks/useGoals'
import type { useNotes } from '../hooks/useNotes'
import type { useTags } from '../hooks/useTags'
import type { useTasks } from '../hooks/useTasks'
import type { Note } from '../lib/types'

interface Props {
  notesApi: ReturnType<typeof useNotes>
  tagsApi: ReturnType<typeof useTags>
  goalsApi: ReturnType<typeof useGoals>
  tasksApi: ReturnType<typeof useTasks>
  onGoToGoals: () => void
  onGoToTasks: () => void
}

interface NotesViewProps extends Props {
  /** When set (e.g. opened from a goal), jump straight into this note. */
  openNoteId?: string | null
  onConsumeOpenNote?: () => void
}

const inputCls =
  'w-full min-w-0 rounded-lg bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500'

export default function NotesView({ openNoteId, onConsumeOpenNote, ...props }: NotesViewProps) {
  const { notesApi } = props
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  // React's "adjust state when a prop changes" pattern: compare against the
  // last request we acted on. A note opened from another tab (e.g. a goal's
  // note list) selects it here, once per distinct request.
  const [lastOpenReq, setLastOpenReq] = useState<string | null>(null)

  if (openNoteId && openNoteId !== lastOpenReq) {
    setLastOpenReq(openNoteId)
    setSelectedId(openNoteId)
    setCreating(false)
    if (onConsumeOpenNote) queueMicrotask(onConsumeOpenNote)
  }

  const selected = notesApi.notes.find((n) => n.id === selectedId)

  if (creating) {
    return (
      <NoteEditor
        onSave={async (title, body, isMarkdown) => {
          const { note, error } = await notesApi.addNote({
            title,
            body,
            is_markdown: isMarkdown,
          })
          if (!error && note) {
            setCreating(false)
            setSelectedId(note.id)
          }
          return error
        }}
        onCancel={() => setCreating(false)}
      />
    )
  }

  if (selected) {
    return <NoteDetail {...props} note={selected} onBack={() => setSelectedId(null)} />
  }

  return <NoteList {...props} onOpen={setSelectedId} onCreate={() => setCreating(true)} />
}

function NoteList({
  notesApi,
  tagsApi,
  onOpen,
  onCreate,
}: Props & { onOpen: (id: string) => void; onCreate: () => void }) {
  const { notes, loading, error } = notesApi

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Notes</h2>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 text-sm font-medium transition-colors"
        >
          + New note
        </button>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-2">
        {notes.map((note) => {
          const noteTags = tagsApi.tagsFor('note_id', note.id)
          return (
            <button
              key={note.id}
              type="button"
              onClick={() => onOpen(note.id)}
              className="w-full text-left bg-slate-800 hover:bg-slate-700/80 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{note.title}</p>
                <div className="flex gap-1 shrink-0">
                  {note.is_markdown && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600/50 text-slate-300">
                      MD
                    </span>
                  )}
                  {note.linked_goal_id && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                      → goal
                    </span>
                  )}
                  {note.linked_task_id && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400">
                      → task
                    </span>
                  )}
                </div>
              </div>
              {note.body && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 whitespace-pre-wrap">
                  {note.body}
                </p>
              )}
              {noteTags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {noteTags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {!loading && notes.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8">
          No notes yet. “+ New note” here, or the floating “+” anywhere.
        </p>
      )}
    </div>
  )
}

function NoteEditor({
  note,
  onSave,
  onCancel,
}: {
  note?: Note
  onSave: (title: string, body: string, isMarkdown: boolean) => Promise<string | null>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [isMarkdown, setIsMarkdown] = useState(note?.is_markdown ?? false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err = await onSave(title.trim(), body, isMarkdown)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        ← Cancel
      </button>
      <input
        autoFocus
        required
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputCls}
      />
      <textarea
        placeholder="Write anything…  (markdown welcome)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={12}
        className={`${inputCls} resize-y font-mono text-[13px] leading-relaxed`}
      />
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg bg-slate-800 p-0.5">
          {([false, true] as const).map((md) => (
            <button
              key={String(md)}
              type="button"
              onClick={() => setIsMarkdown(md)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                isMarkdown === md ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {md ? 'Markdown' : 'Plain'}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  )
}

function NoteDetail({
  note,
  notesApi,
  tagsApi,
  goalsApi,
  tasksApi,
  onGoToGoals,
  onGoToTasks,
  onBack,
}: Props & { note: Note; onBack: () => void }) {
  const [editing, setEditing] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [convertError, setConvertError] = useState<string | null>(null)

  const noteTags = tagsApi.tagsFor('note_id', note.id)
  const linkedGoal = goalsApi.goals.find((g) => g.id === note.linked_goal_id)
  const linkedTask = tasksApi.tasks.find((t) => t.id === note.linked_task_id)

  if (editing) {
    return (
      <NoteEditor
        note={note}
        onSave={async (title, body, isMarkdown) => {
          const { error } = await notesApi.updateNote(note.id, {
            title,
            body,
            is_markdown: isMarkdown,
          })
          if (!error) setEditing(false)
          return error
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const addTag = async (e: FormEvent) => {
    e.preventDefault()
    const name = tagInput.trim()
    if (!name) return
    const { tag, error } = await tagsApi.getOrCreateTag(name)
    if (tag && !error) {
      await tagsApi.attachTag(tag.id, 'note_id', note.id)
      setTagInput('')
    }
  }

  const convertToGoal = async () => {
    setConvertError(null)
    const { goal, error } = await goalsApi.addGoal({
      title: note.title,
      deadline: null,
      status: 'not_started',
    })
    if (error || !goal) return setConvertError(error ?? 'Could not create goal.')
    const { error: linkErr } = await notesApi.updateNote(note.id, { linked_goal_id: goal.id })
    if (linkErr) setConvertError(linkErr)
  }

  const convertToTask = async () => {
    setConvertError(null)
    const { task, error } = await tasksApi.addTask({
      title: note.title,
      due_date: null,
      priority: 'medium',
      status: 'not_started',
      project_id: null,
    })
    if (error || !task) return setConvertError(error ?? 'Could not create task.')
    const { error: linkErr } = await notesApi.updateNote(note.id, { linked_task_id: task.id })
    if (linkErr) setConvertError(linkErr)
  }

  const handleDelete = async () => {
    if (confirm(`Delete note "${note.title}"?`)) {
      const { error } = await notesApi.deleteNote(note.id)
      if (!error) onBack()
    }
  }

  const unusedTags = tagsApi.tags.filter((t) => !noteTags.some((nt) => nt.tag.id === t.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Notes
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold">{note.title}</h2>

      <div className="bg-slate-800 rounded-xl p-4">
        {note.is_markdown ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{note.body || '*Empty note*'}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{note.body || 'Empty note'}</p>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap items-center">
        {noteTags.map(({ itemTagId, tag }) => (
          <span
            key={itemTagId}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300"
          >
            #{tag.name}
            <button
              type="button"
              onClick={() => tagsApi.detachTag(itemTagId)}
              aria-label={`Remove tag ${tag.name}`}
              className="hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
        <form onSubmit={addTag} className="inline-flex">
          <input
            list="tag-options"
            placeholder="+ tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="w-24 rounded-full bg-slate-800 text-xs px-3 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="tag-options">
            {unusedTags.map((t) => (
              <option key={t.id} value={t.name} />
            ))}
          </datalist>
        </form>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Goal & task links</h3>

        {linkedGoal ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoToGoals}
              className="text-sm text-emerald-400 hover:text-emerald-300 truncate"
            >
              → Goal: {linkedGoal.title}
            </button>
            <button
              type="button"
              onClick={() => notesApi.updateNote(note.id, { linked_goal_id: null })}
              className="text-xs text-slate-500 hover:text-red-400 shrink-0"
            >
              unlink
            </button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap items-center">
            <button
              type="button"
              onClick={convertToGoal}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-sm transition-colors"
            >
              Convert → Goal
            </button>
            {goalsApi.goals.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    notesApi.updateNote(note.id, { linked_goal_id: e.target.value })
                }}
                className="rounded-lg bg-slate-700 text-sm text-slate-300 px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 max-w-48"
              >
                <option value="">Add to existing goal…</option>
                {goalsApi.goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {linkedTask ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoToTasks}
              className="text-sm text-sky-400 hover:text-sky-300 truncate"
            >
              → Task: {linkedTask.title}
            </button>
            <button
              type="button"
              onClick={() => notesApi.updateNote(note.id, { linked_task_id: null })}
              className="text-xs text-slate-500 hover:text-red-400 shrink-0"
            >
              unlink
            </button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap items-center">
            <button
              type="button"
              onClick={convertToTask}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-sm transition-colors"
            >
              Convert → Task
            </button>
            {tasksApi.tasks.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    notesApi.updateNote(note.id, { linked_task_id: e.target.value })
                }}
                className="rounded-lg bg-slate-700 text-sm text-slate-300 px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 max-w-48"
              >
                <option value="">Add to existing task…</option>
                {tasksApi.tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {convertError && <p className="text-sm text-red-400">{convertError}</p>}
        <p className="text-[11px] text-slate-500">
          Convert makes a new goal/task from this note; “Add to existing” links it to one you
          already have. The note stays either way.
        </p>
      </div>
    </div>
  )
}
