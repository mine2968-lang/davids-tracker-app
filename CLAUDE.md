# CLAUDE.md

Operational rules + current state for this project. The original plan (what + why) lives in [.md files/gameplan.md](.md%20files/gameplan.md). This file is the source of truth for **how the code is actually built today** and the constraints to obey every session.

**Version: 0.5** — MVP through Notes is live and in daily use; Projects has been expanded well past the original plan. Polished but not "done."

## What this is

Cross-platform (iPhone + Mac) personal tracker for goals, tasks, notes, and projects. Installable **PWA** so one codebase runs on both platforms and is buildable entirely on Windows. Two users (owner + brother), each with **fully separate data** — no sharing/collaboration logic.

Live at **davids-tracker-app.vercel.app**. Supabase project ref: `tidvbyxnhpctfurmvffb`.

## Locked stack — do not swap without asking

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 |
| Backend / auth / sync | Supabase (Postgres, email+password auth, RLS, Storage) |
| Hosting | Vercel (free Hobby tier, auto-deploys on push to `master`) |
| Source control | GitHub (`mine2968-lang/davids-tracker-app`) |
| Drag-and-drop | `@dnd-kit` (touch-friendly; native HTML5 drag doesn't work on iPhone) |
| Markdown | `react-markdown` + `@tailwindcss/typography` |

Every dependency must be Windows-buildable and free at this scale. No Mac-only tooling (rules out native SwiftUI — that's why this is a PWA).

## Hard rules (never violate)

- **Row-level security is non-negotiable.** Every table belongs to a user via `user_id` (defaults to `auth.uid()`). RLS enforces "see only your own rows." Never write a query or policy that could leak one user's data to another. Storage writes are scoped to the user's own `{auth.uid()}/` path prefix.
- **One `tasks` table.** Goal sub-tasks are just tasks with an optional `goal_id`/`milestone_id`. A task under a goal/project also appears in the main Tasks view. Never build a second task system.
- **Links, not moves.** Converting/attaching a note keeps the note as the origin record and references the spawned/linked item via `linked_goal_id` / `linked_task_id` / `linked_project_id`. FKs are `on delete set null` so deleting the target keeps the note.
- **Deletes preserve children.** Deleting a project/goal nulls the FK on its tasks (they survive as "No project"/unlinked), not cascade-delete. Milestones and note-folders cascade with their goal; their tasks/notes survive.
- **Secrets stay out of git.** Supabase keys in `.env` (gitignored). Only the anon/publishable key ships to the client; service-role key never reaches the frontend.

## Data model (current)

```
goals → milestones (ordered) → tasks            tasks.goal_id / milestone_id (optional)
projects → tasks                                tasks.project_id (optional)
projects → note_folders → notes                 notes grouped into per-goal/project folders
notes ──link──▶ goals / tasks / projects        linked_*_id, set-null on delete
tags ──item_tags──▶ goals / tasks / notes       shared pool, cross-tracker (item_tags not yet UI-wired everywhere)
```

Key columns added past the original plan: `projects` has `image_url`, `deadline`, `status`, `sort_order`; `tasks` and `milestones` and `note_folders` have `sort_order`; `notes` has `folder_id` and `linked_project_id`. Progress % (`goalProgress`, `projectProgress` in [src/lib/types.ts](src/lib/types.ts)) = completed tasks / all tasks under the item, computed client-side.

## Code architecture & patterns (match these)

- **Hooks own data + Supabase calls**, one per entity: `useTasks`, `useProjects`, `useGoals`, `useNotes`, `useTags`, plus `useImageUpload` for Storage. Hook instances are created once in `App.tsx`'s `Shell` and passed down as `xxxApi` props, so every tab shares one source of truth.
- **Hook shape:** `refresh` (re-select, ordered), CRUD methods returning `{ data?, error: string | null }`, optimistic local state updates after a successful call. Cross-device sync = refetch on `visibilitychange` (no realtime). New rows append/prepend; reorders write `sort_order` per id.
- **Views** in `src/views/` (one per tab); **reusable pieces** in `src/components/`. Forms (`TaskForm`, `GoalForm`, `ProjectForm`) are shared between create and edit via an optional `initial` prop. `Sortable.tsx` wraps any row/card for `@dnd-kit` with a drag handle (render-prop).
- **Auth:** `AuthProvider` (`AuthContext.tsx`) holds the session; `useAuth` (`auth-context.ts`) is the separate hook file (keeps Fast Refresh happy — don't merge them back).
- **Styling:** Tailwind utility classes inline, dark slate palette (`bg-slate-900/800/700`, `indigo-500` accent). Buttons that toggle/act should *look* pressable (bordered pill + icon), not faint text links — the user has asked for this repeatedly.
- **iOS gotchas already handled:** `min-w-0 appearance-none` on date inputs (or they overflow); `env(safe-area-inset-top/bottom)` padding so content clears the notch and home indicator. Keep these when adding inputs/bars.

## Database migration workflow

Schema changes are **two files + one manual step**:
1. Add an idempotent migration to `supabase/migrations/00N_name.sql` (use `add column if not exists`, `create ... if not exists`, `drop policy if exists` then recreate). Enable RLS + owner policies on any new table.
2. Mirror the same change into `supabase/schema.sql` (the canonical full schema for a fresh setup).
3. **The user runs the migration by hand** in the Supabase SQL Editor — Claude can't apply it. After writing a migration, give the user the SQL to paste and tell them the feature will error until it's run. The user is a beginner with the Supabase dashboard: give click-by-click steps.

Existing migrations: `001_note_folders`, `002_projects_expand` (+ Storage bucket `project-images`), `003_note_project_link`.

## Git: auto-commit + push

**Commit and push to `master` automatically after each completed feature or fix** — once the change is whole and `npm run lint && npm run build` both pass. Don't ask first; this is the standing workflow. Each push auto-deploys to Vercel.

- Don't commit half-finished work or anything that fails lint/build.
- Conventional Commits subject (`feat:`, `fix:`, `style:`, `feat(scope):` …), imperative, ≤72 chars. Body only when the "why" isn't obvious.
- One logical change per commit; commit at clear points rather than batching unrelated edits.
- Never commit `.env` or secrets. Never force-push or skip hooks.

## Conventions

- Windows shell is PowerShell (watch path separators, env-var syntax). A Bash tool is also available for POSIX scripts.
- `npm run dev` for local; verify with `npm run lint` + `npm run build` before committing.
- Supabase free project pauses after ~1 week idle, wakes on next request — expected, not a bug.

## What's left / backlog

- **Phase 4 glue (not yet done):** explicit dark-mode toggle (app is dark-only now), archive/completed history (archive instead of delete), and wiring shared **tags across all trackers + cross-tracker filtering** (the `tags`/`item_tags` tables exist; only notes use them in the UI so far).
- Backlog the model already accommodates: gym tracker, school tracker, scheduling views, recurring tasks, global search, offline-first writes, push/reminders.
- Known v1 trade-offs to leave alone unless asked: deleting a project orphans its Storage image (harmless); main Tasks tab stays due-date sorted (drag-reorder is Projects-only); a note links to one of each target type at a time.
