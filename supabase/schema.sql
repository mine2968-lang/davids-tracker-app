-- David's Tracker — schema + row-level security
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run: idempotent where possible.

-- ============ Tables ============

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  image_url   text,
  deadline    date,
  status      text not null default 'not_started'
              check (status in ('not_started', 'in_progress', 'done')),
  sort_order  integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null,
  deadline    date,
  status      text not null default 'not_started'
              check (status in ('not_started', 'in_progress', 'done')),
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists milestones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id    uuid not null references goals (id) on delete cascade,
  title      text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- One tasks table: standalone tasks AND goal sub-tasks (goal_id/milestone_id optional).
create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null,
  due_date     date,
  priority     text not null default 'medium'
               check (priority in ('low', 'medium', 'high')),
  status       text not null default 'not_started'
               check (status in ('not_started', 'in_progress', 'done')),
  goal_id      uuid references goals (id) on delete set null,
  milestone_id uuid references milestones (id) on delete set null,
  project_id   uuid references projects (id) on delete set null,
  sort_order   integer not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Note → goal/task conversion is a LINK: the note stays and references what it spawned.
create table if not exists notes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title          text not null,
  body           text not null default '',
  is_markdown    boolean not null default false,
  linked_goal_id uuid references goals (id) on delete set null,
  linked_task_id uuid references tasks (id) on delete set null,
  archived_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Folders group a goal's linked notes (see migration 001).
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

-- Shared tag pool across goals/tasks/notes.
create table if not exists tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Joins a tag to exactly one item (goal, task, or note).
create table if not exists item_tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tag_id  uuid not null references tags (id) on delete cascade,
  goal_id uuid references goals (id) on delete cascade,
  task_id uuid references tasks (id) on delete cascade,
  note_id uuid references notes (id) on delete cascade,
  check (
    (goal_id is not null)::int + (task_id is not null)::int + (note_id is not null)::int = 1
  ),
  unique (tag_id, goal_id),
  unique (tag_id, task_id),
  unique (tag_id, note_id)
);

-- ============ Indexes ============

create index if not exists idx_projects_user   on projects (user_id);
create index if not exists idx_goals_user      on goals (user_id);
create index if not exists idx_milestones_user on milestones (user_id);
create index if not exists idx_milestones_goal on milestones (goal_id);
create index if not exists idx_note_folders_user on note_folders (user_id);
create index if not exists idx_note_folders_goal on note_folders (goal_id);
create index if not exists idx_notes_folder      on notes (folder_id);
create index if not exists idx_tasks_user      on tasks (user_id);
create index if not exists idx_tasks_goal      on tasks (goal_id);
create index if not exists idx_tasks_milestone on tasks (milestone_id);
create index if not exists idx_tasks_project   on tasks (project_id);
create index if not exists idx_tasks_due       on tasks (user_id, due_date);
create index if not exists idx_notes_user      on notes (user_id);
create index if not exists idx_tags_user       on tags (user_id);
create index if not exists idx_item_tags_user  on item_tags (user_id);
create index if not exists idx_item_tags_tag   on item_tags (tag_id);

-- ============ updated_at trigger ============

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_goals_updated_at on goals;
create trigger trg_goals_updated_at before update on goals
  for each row execute function set_updated_at();

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at before update on tasks
  for each row execute function set_updated_at();

drop trigger if exists trg_notes_updated_at on notes;
create trigger trg_notes_updated_at before update on notes
  for each row execute function set_updated_at();

-- ============ Row-level security ============
-- Non-negotiable: every table is owner-only. (select auth.uid()) form lets
-- Postgres cache the value per statement instead of per row.

alter table projects   enable row level security;
alter table goals      enable row level security;
alter table milestones enable row level security;
alter table tasks      enable row level security;
alter table notes        enable row level security;
alter table note_folders enable row level security;
alter table tags         enable row level security;
alter table item_tags    enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['projects', 'goals', 'milestones', 'tasks', 'notes', 'note_folders', 'tags', 'item_tags']
  loop
    execute format('drop policy if exists "owner_select" on %I', t);
    execute format('drop policy if exists "owner_insert" on %I', t);
    execute format('drop policy if exists "owner_update" on %I', t);
    execute format('drop policy if exists "owner_delete" on %I', t);

    execute format(
      'create policy "owner_select" on %I for select using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "owner_insert" on %I for insert with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "owner_update" on %I for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "owner_delete" on %I for delete using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;
