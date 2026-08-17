-- Allow public delivery only for active media explicitly referenced by content
-- that already qualifies for public visibility. The media bucket stays private.

begin;

grant usage on schema private to anon;

create or replace function private.is_media_public(candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.homepage_content
    where image_media_id = candidate_id and status = 'published' and active = true
  ) or exists (
    select 1 from public.homepage_experiences
    where image_media_id = candidate_id and status = 'published' and active = true
  ) or exists (
    select 1 from public.menu_items
    join public.menu_categories on menu_categories.id = menu_items.category_id
    where menu_items.image_media_id = candidate_id
      and menu_items.status = 'published'
      and menu_items.availability = 'available'
      and menu_categories.active = true
  ) or exists (
    select 1 from public.promos
    where image_media_id = candidate_id
      and status = 'published'
      and (start_date is null or start_date <= now())
      and (end_date is null or end_date >= now())
  ) or exists (
    select 1 from public.events
    where image_media_id = candidate_id and status = 'published'
  ) or exists (
    select 1 from public.gallery_items
    where media_id = candidate_id and status = 'published' and active = true
  );
$$;

create or replace function private.is_media_path_public(
  candidate_bucket text,
  candidate_path text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.media
    where storage_bucket = candidate_bucket
      and storage_path = candidate_path
      and active = true
      and private.is_media_public(id)
  );
$$;

revoke all on function private.is_media_public(uuid) from public, anon, authenticated;
revoke all on function private.is_media_path_public(text, text) from public, anon, authenticated;
grant execute on function private.is_media_public(uuid) to anon, authenticated;
grant execute on function private.is_media_path_public(text, text) to anon, authenticated;

grant select on table public.media to anon;

create policy media_public_referenced_read
on public.media
for select
to anon, authenticated
using (
  active = true
  and (select private.is_media_public(id))
);

create policy media_objects_public_referenced_read
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'media'
  and (select private.is_media_path_public(bucket_id, name))
);

commit;
