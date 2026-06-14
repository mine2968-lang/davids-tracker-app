-- Migration 003 — link notes to projects
-- Run once in Supabase SQL Editor. Idempotent.
--
-- A note may reference a project via notes.linked_project_id, mirroring the
-- existing linked_goal_id / linked_task_id. The note stays the origin record;
-- this is a link, not a move. FK set null so deleting a project keeps the note.

alter table notes
  add column if not exists linked_project_id uuid references projects (id) on delete set null;

create index if not exists idx_notes_linked_project on notes (linked_project_id);
