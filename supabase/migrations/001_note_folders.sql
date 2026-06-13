-- Migration 001 — note folders inside goals
-- Run once in Supabase SQL Editor. Idempotent.
--
-- A folder groups notes under one goal. Notes get an optional folder_id.
-- A note is linked to a goal via notes.linked_goal_id (already exists);
-- folders just organize those linked notes visually.

create table if not exists note_folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id    uuid not null references goals (id) on delete cascade,
  name       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table notes
  add column if not exists folder_id uuid references note_folders (id) on delete set null;

create index if not exists idx_note_folders_user on note_folders (user_id);
create index if not exists idx_note_folders_goal on note_folders (goal_id);
create index if not exists idx_notes_folder      on notes (folder_id);

alter table note_folders enable row level security;

drop policy if exists "owner_select" on note_folders;
drop policy if exists "owner_insert" on note_folders;
drop policy if exists "owner_update" on note_folders;
drop policy if exists "owner_delete" on note_folders;

create policy "owner_select" on note_folders for select using (user_id = (select auth.uid()));
create policy "owner_insert" on note_folders for insert with check (user_id = (select auth.uid()));
create policy "owner_update" on note_folders for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "owner_delete" on note_folders for delete using (user_id = (select auth.uid()));
