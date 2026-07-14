
-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('profile-documents', 'profile-documents', false)
on conflict (id) do nothing;

-- Ensure RLS is enabled on storage.objects
alter table if exists storage.objects enable row level security;

-- Clean up any older policies with the same intent (safe if none exist)
drop policy if exists "profile-docs - insert own folder" on storage.objects;
drop policy if exists "profile-docs - select own folder" on storage.objects;
drop policy if exists "profile-docs - update own folder" on storage.objects;
drop policy if exists "profile-docs - delete own folder" on storage.objects;

-- INSERT: allow authenticated users to upload into their own folder: <uid>/...
create policy "profile-docs - insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-documents'
  and (
    -- allow when the path starts with their UID/
    split_part(name, '/', 1) = auth.uid()::text
  )
);

-- SELECT: allow users to read their own files (required for createSignedUrl)
create policy "profile-docs - select own folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-documents'
  and (
    owner = auth.uid()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);

-- UPDATE: allow users to overwrite their own files (needed for upsert: true)
create policy "profile-docs - update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-documents'
  and (
    owner = auth.uid()
    or split_part(name, '/', 1) = auth.uid()::text
  )
)
with check (
  bucket_id = 'profile-documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- DELETE: allow users to delete files in their own folder
create policy "profile-docs - delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-documents'
  and (
    owner = auth.uid()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);
