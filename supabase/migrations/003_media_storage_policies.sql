-- Dapoer Palem private media bucket policies.
--
-- Objects are namespaced as <folder>/<auth.uid()>/<uuid>-<filename>. The
-- database remains authoritative for roles; clients never supply a role.

begin;

update storage.buckets
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']::text[]
where id = 'media';

create policy media_objects_cms_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'media'
  and (select private.has_any_role(
    array['super_admin', 'content_manager']::text[]
  ))
);

create policy media_objects_cms_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
  and (select private.has_any_role(
    array['super_admin', 'content_manager']::text[]
  ))
  and (storage.foldername(name))[1] in (
    'branding',
    'homepage',
    'menu',
    'promos',
    'events',
    'gallery',
    'uploads'
  )
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy media_objects_super_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
  and (select private.has_any_role(array['super_admin']::text[]))
);

-- A content manager may remove only their own object when no media metadata
-- row exists. This supports compensating cleanup after a failed metadata insert
-- without granting hard-delete access to registered library assets.
create policy media_objects_content_manager_upload_rollback
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
  and (select private.has_any_role(array['content_manager']::text[]))
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and not exists (
    select 1
    from public.media
    where media.storage_bucket = storage.objects.bucket_id
      and media.storage_path = storage.objects.name
  )
);

commit;
