# CLAUDE.md

Operational rules for building this project. The full plan (what + why) lives in [.md files/gameplan.md](.md%20files/gameplan.md) — read it before starting a phase. This file is the short list of constraints to obey every session.

## What this is

Cross-platform (iPhone + Mac) personal tracker for goals, tasks, notes. Built as an installable **PWA** so one codebase runs on both platforms and is buildable entirely on Windows. Two users (owner + brother), each with **fully separate data** — no sharing/collaboration logic.

## Locked stack — do not swap without asking

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + Tailwind |
| Backend / auth / sync | Supabase (Postgres, email+password auth, RLS) |
| Hosting | Vercel (free Hobby tier) |
| Source control | GitHub (drives Vercel deploys) |

Every dependency must be Windows-buildable and free at this scale. No Mac-only tooling (rules out native SwiftUI — that's why this is a PWA).

## Hard rules

- **Row-level security is non-negotiable.** Every table except auth belongs to a user. RLS policies enforce "see only your own rows." Never write a query or policy that could leak one user's data to another.
- **One `tasks` table.** Goal sub-tasks are just tasks with an optional `goal_id`/`milestone_id` — not a second system. A task under a goal can also appear in the main Tasks view.
- **Shared tags.** One tag pool across goals/tasks/notes via `tags` + `item_tags` join. Not a text field per item.
- **Note → goal/task is a link, not a move.** Converting a note keeps the note as the origin record and references the spawned item (`linked_goal_id` / `linked_task_id`).
- **Secrets stay out of git.** Supabase keys in `.env` (gitignored). Only the anon/public key ships to the client; service-role key never reaches the frontend.

## Data model (spine)

`goals` → `milestones` (ordered phases) → `tasks`. Progress % rolls up from completed tasks under a goal. Plus `notes`, `projects` (task grouping), `tags`, `item_tags`. Full field list in the gameplan §3.

## Build order — phases are gates

Build strict MVP first, one phase at a time. Each phase is a discrete, reviewable, testable chunk. **Stop at the end of each phase for review before starting the next.** Commit at clear points.

- **Phase 0 — Foundation:** Vite+React repo, Tailwind, PWA manifest+service worker, Supabase project + schema + RLS, Vercel wired. Done when a deployed URL shows login and you can sign up / log in.
- **Phase 1 — Tasks + Home shell:** tasks CRUD (due date, priority, status, project), Home shows due-today + overdue. Done when login → create task → syncs → appears on other device.
- **Phase 2 — Goals:** goals + milestones + linked tasks + rolled-up progress + Home progress bars.
- **Phase 3 — Notes:** plain↔markdown toggle, tags, quick-capture "+" to Notes, note→goal/task conversion.
- **Phase 4 — Glue:** dark mode, archive/completed history (archive, don't delete), shared tags + cross-tracker filtering wired across all three trackers.

Backlog (not v1, but model already accommodates): gym tracker, school tracker, scheduling views, recurring tasks, global search, offline-first, push/reminders.

## Stance for v1

- **Polish:** rough but functional. Clean Tailwind defaults, dark mode, readable spacing. Don't over-style — prove the system, polish later.
- **Offline:** online-mostly with local caching (opens and shows cached data without a connection; edits expect the server soon). Do **not** pay the offline-first tax now.
- **UI structure:** tab bar (Home · Goals · Tasks · Notes) on iOS, same structure as a sidebar on Mac via responsive layout.

## Conventions

- Windows shell is PowerShell. Watch path separators and env-var syntax in scripts.
- `npm run dev` for local; push to GitHub auto-deploys to Vercel.
- Supabase free project pauses after ~1 week idle, wakes on next request — expected, not a bug.
