-- Migration 002 — project image, deadline/status, manual ordering
-- Run once in Supabase SQL Editor. Idempotent.

-- ============ Columns ============

alter table projects
  add column if not exists image_url  text,
  add column if not exists deadline   date,
  add column if not exists status     text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done')),
  add column if not exists sort_order integer not null default 0;

alter table tasks
  add column if not exists sort_order integer not null default 0;

-- ============ Storage bucket for project images ============
-- Public read (so <img src> works; filenames are unguessable UUIDs).
-- Writes restricted to the owner's own {user_id}/... path.

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update set public = true;

drop policy if exists "project_images_read"   on storage.objects;
drop policy if exists "project_images_insert" on storage.objects;
drop policy if exists "project_images_update" on storage.objects;
drop policy if exists "project_images_delete" on storage.objects;

-- Anyone may read (bucket is public).
create policy "project_images_read" on storage.objects
  for select using (bucket_id = 'project-images');

-- Only the signed-in owner may write under their own folder.
create policy "project_images_insert" on storage.objects
  for insert with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "project_images_update" on storage.objects
  for update using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "project_images_delete" on storage.objects
  for delete using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
