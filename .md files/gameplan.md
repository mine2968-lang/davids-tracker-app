# Tracker App — Build Gameplan

A cross-platform (iPhone + Mac) personal tracker for goals, tasks, and notes/hobby ideas. Built as an installable web app (PWA) so it runs on both platforms from a single codebase, buildable entirely on Windows.

-----

## 1. Overview

**What this is:** A personal productivity app for tracking goals, tasks, and notes/ideas, usable on iPhone and Mac.

**Who it’s for:** Two users (you + your brother), each with **fully separate data** — everyone logs in and sees only their own stuff. No sharing or collaboration logic.

**Why this approach:** Native SwiftUI would be ideal for feel + free iCloud sync, but it requires a Mac to build. Since the build environment is Windows-only and cross-device sync is essential, a **PWA backed by a hosted database** is the best fit: buildable on Windows, syncs across devices, installable to the home screen on both platforms, and free at this scale.

**v1 polish level:** Rough but functional. Clean defaults, no heavy styling. Prove the system works, polish later.

-----

## 2. Tech Stack (locked)

|Layer         |Choice                      |Why                                                                                                                                                                                |
|--------------|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Frontend      |**React + Vite + Tailwind** |Reusable components across trackers, big ecosystem, dark mode for free, fast builds. Installable as a PWA.                                                                         |
|Backend / sync|**Supabase**                |Postgres fits the relational data model (goals → milestones → tasks). Built-in email/password auth, row-level security for separate data, real-time sync, you own/export your data.|
|Hosting       |**Vercel** (free Hobby tier)|Auto-deploys from GitHub, public URL, no cost, no credit card.                                                                                                                     |
|Source control|**GitHub**                  |Fits existing Git workflow; drives Vercel deploys.                                                                                                                                 |
|Auth          |**Email + password**        |Native to Supabase (hashing, sessions, reset all built in). Familiar.                                                                                                              |

All Windows-buildable, all free at this scale, all Claude-Code-friendly.

-----

## 3. Data Model

The spine of the app. Get this right early — everything builds on it.

### Entities

- **users** — handled by Supabase Auth. Every other row belongs to a user (row-level security enforces “see only your own”).
- **goals** — `title`, `deadline`, `status` (Not started / In progress / Done), `progress` (rolled up from completed sub-tasks).
- **milestones** — phases belonging to a goal. `goal_id`, `title`, `order`. A goal is broken into ordered milestones.
- **tasks** — `title`, `due_date`, `priority`, `status` (Not started / In progress / Done). Optional `goal_id` + `milestone_id` (a task can stand alone OR live under a goal/milestone). Optional `project_id` for grouping.
- **notes** — `title`, `body`, `is_markdown` (toggle between plain-text dump and markdown view). Can link to a goal or task it spawned (`linked_goal_id` / `linked_task_id`).
- **projects** (categories) — for grouping tasks.
- **tags** — shared tag pool (its own table, not a text field).
- **item_tags** — links a tag to any item (goal, task, or note), enabling cross-tracker filtering.

### Key model decisions

- **Goal hierarchy:** Goal → Milestones (phases) → Tasks (the to-dos under each phase). Progress % rolls up from completed tasks under the goal.
- **Tasks are unified:** Goal “sub-tasks” are just **tasks** with an optional `goal_id`/`milestone_id`. One `tasks` table, not two systems. A task created under a goal can also appear in the main Tasks view.
- **Shared tags:** One tag pool across goals, tasks, and notes (via `item_tags`), so a “fitness” tag matches everywhere and you can filter across trackers.
- **Idea → goal/task conversion:** Converting a note **links** them — the note stays as the origin record and references the goal/task it spawned. Requires the lightweight link fields on notes.

-----

## 4. Navigation & UI

- **Primary structure:** tab bar (iOS-native, thumb-friendly) — **Home · Goals · Tasks · Notes**. On Mac, the same structure becomes a sidebar via responsive layout (essentially free).
- **Home dashboard shows:** tasks due today + overdue, and active goals with progress bars. Action-oriented.
- **Quick-capture:** a persistent “+” that drops a thought straight into **Notes** by default (capture friction-free, triage later). Notes acts as the inbox.
- **Styling:** minimal Tailwind defaults + dark mode. Readable spacing. Upgrade aesthetics once it works.

-----

## 5. Hosting & Testing (free tier)

Goal: let your brother test on his own devices without paying for hosting.

**Local dev (you only):** `npm run dev` runs the app at `localhost` on your machine. Only you can see it.

**Getting it to your brother — Vercel (recommended):**

1. Push the repo to GitHub.
1. Connect the GitHub repo to Vercel’s free **Hobby** tier (no credit card).
1. Every push auto-deploys and gives a public URL like `your-app.vercel.app`.
1. Send him the link — he opens it on iPhone/Mac and installs it to his home screen.

**Quick peeks (optional):** `ngrok` or Vite’s `--host` flag exposes `localhost` temporarily for “look at this real quick” moments. The URL dies when your machine closes — use Vercel for anything tested over days.

**Backend:** Supabase free tier covers auth + database. Note: a Supabase project **pauses after ~1 week of zero activity** but wakes on the next request; active testing keeps it alive.

**Caveats (not problems at this scale):**

- Free Vercel URLs are technically public, but all data sits behind email/password login, so it’s protected.
- You’d only pay for a custom domain (~$10–15/yr) or usage far beyond free limits — neither applies here.

**Cost: $0.** Vercel free + Supabase free + GitHub.

-----

## 6. Build Order (phased)

Strict MVP first, then clearly scoped iteration. Each phase is a discrete, reviewable, testable chunk with clear commit points — built for Claude Code to execute with review between phases.

### Phase 0 — Foundation

Boring but unblocks everything.

- Initialize fresh repo (`npm create vite@latest`, React template), Git init, push to GitHub.
- Add Tailwind. Set up PWA manifest + service worker (installable).
- Create Supabase project; configure email/password auth.
- Define the database schema (all tables above) + row-level security policies (users see only their own rows).
- Wire Vercel to the repo; confirm a deployed URL loads.
- **Done when:** a deployed URL shows a login screen, and you can sign up / log in.

### Phase 1 — MVP: Tasks + Home shell

The easy, self-contained vertical slice that proves the whole loop.

- Tasks tracker: create / edit / complete, due date, priority, status, project grouping.
- Home dashboard shell: due today + overdue tasks.
- **Done when:** login → create a task → it syncs → appears on the other device. Core loop proven.

### Phase 2 — Goals

The rich hierarchy.

- Goals: title, deadline, status, progress.
- Milestones (phases) under a goal.
- Tasks linked to a goal/milestone; progress % rolls up.
- Home dashboard: add active goals + progress bars.
- **Done when:** a goal with milestones and sub-tasks shows accurate rolled-up progress.

### Phase 3 — Notes

- Plain-text ↔ markdown toggle (view switch).
- Tags on notes.
- Quick-capture “+” dumping to Notes.
- Convert/link a note → goal or task (note stays, references the new item).
- **Done when:** you can capture an idea, view it as markdown, and convert it into a linked goal/task.

### Phase 4 — Glue

- Dark mode.
- Archive / completed history (items get archived/completed state, not deleted).
- Shared tags fully wired across all three trackers + cross-tracker filtering.
- **Done when:** completed items archive cleanly and tags filter across trackers.

### Backlog / Later

Known future scope — not v1, but the model already accommodates it:

- Gym progress tracker
- School tracker
- Time frames / scheduling views
- Recurring tasks
- Search across everything
- Offline-first (local writes that queue + sync)
- Push notifications / reminders

-----

## 7. Workflow Notes

- **Execution:** Claude Code does the building; you review each phase before moving on.
- **Structure:** layered CLAUDE.md guidance, phases as reviewable chunks, clear commit points (same mature setup as the ROM hack project).
- **Offline stance for v1:** online-mostly with local caching (app opens and shows data without a connection; edits expect the server soon). Don’t pay the offline-first tax now — upgrade later if gym-basement logging becomes a real pain point.