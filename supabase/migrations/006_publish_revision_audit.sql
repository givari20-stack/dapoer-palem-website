-- Publishing history and trusted CMS audit operations. No content is seeded.
begin;

alter table public.menu_categories add column if not exists status text not null default 'published';
alter table public.menu_categories drop constraint if exists menu_categories_status_check;
alter table public.menu_categories add constraint menu_categories_status_check check (status in ('draft', 'published', 'archived'));

drop policy if exists menu_categories_public_read on public.menu_categories;
create policy menu_categories_public_read on public.menu_categories for select
to anon, authenticated using (active = true and status = 'published');

create or replace function public.record_cms_revision(
  p_entity_type text, p_entity_id uuid, p_snapshot jsonb,
  p_change_summary text, p_action text
)
returns public.content_revisions
language plpgsql security definer set search_path = ''
as $$
declare
  next_version integer;
  revision public.content_revisions;
  allowed_entities constant text[] := array['homepage_content','homepage_experiences','menu_categories','menu_items','promos','events','gallery_items'];
  allowed_actions constant text[] := array['create','update','save_draft','publish','archive','restore'];
begin
  if auth.uid() is null or not private.has_any_role(array['super_admin','content_manager']::text[]) then
    raise exception using errcode = '42501', message = 'CMS_PERMISSION_DENIED';
  end if;
  if not (p_entity_type = any(allowed_entities)) or not (p_action = any(allowed_actions))
    or p_entity_id is null or p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_REVISION';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_entity_type || ':' || p_entity_id::text, 0));
  select coalesce(max(version), 0) + 1 into next_version from public.content_revisions
    where entity_type = p_entity_type and entity_id = p_entity_id;
  insert into public.content_revisions (entity_type,entity_id,version,snapshot,change_summary,changed_by)
    values (p_entity_type,p_entity_id,next_version,p_snapshot,nullif(left(btrim(p_change_summary),240),''),auth.uid())
    returning * into revision;
  insert into public.audit_logs (user_id,action,entity_type,entity_id,metadata)
    values (auth.uid(),p_action,p_entity_type,p_entity_id,jsonb_build_object('version',next_version,'summary',revision.change_summary));
  return revision;
end;
$$;

revoke all on function public.record_cms_revision(text,uuid,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.record_cms_revision(text,uuid,jsonb,text,text) to authenticated;

create or replace function public.record_auth_activity(p_action text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare audit_id uuid;
begin
  if auth.uid() is null or p_action not in ('login', 'logout') then
    raise exception using errcode = '42501', message = 'AUTH_ACTIVITY_DENIED';
  end if;
  insert into public.audit_logs (user_id,action,entity_type,metadata)
    values (auth.uid(),p_action,'auth',null) returning id into audit_id;
  return audit_id;
end;
$$;
revoke all on function public.record_auth_activity(text) from public,anon,authenticated;
grant execute on function public.record_auth_activity(text) to authenticated;
create index if not exists content_revisions_entity_created_idx on public.content_revisions (entity_type,entity_id,version desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

create policy audit_logs_content_manager_read on public.audit_logs for select to authenticated
using ((select private.has_any_role(array['content_manager']::text[])) and entity_type in ('homepage_content','homepage_experiences','menu_categories','menu_items','promos','events','gallery_items','media'));
create policy audit_logs_reservation_staff_read on public.audit_logs for select to authenticated
using ((select private.has_any_role(array['reservation_staff']::text[])) and entity_type = 'reservations');

-- Profiles contain only id, display name, role, and timestamps. CMS readers need
-- these non-secret identities to attribute revision history accurately.
create policy profiles_cms_collaborator_read on public.profiles for select to authenticated
using ((select private.has_any_role(array['super_admin','content_manager','viewer']::text[])));

create or replace function private.is_media_public(candidate_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.homepage_content where image_media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.homepage_experiences where image_media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.menu_items join public.menu_categories on menu_categories.id=menu_items.category_id where menu_items.image_media_id=candidate_id and menu_items.status='published' and menu_items.availability='available' and menu_categories.active=true and menu_categories.status='published')
  or exists (select 1 from public.promos where image_media_id=candidate_id and status='published' and (start_date is null or start_date<=now()) and (end_date is null or end_date>=now()))
  or exists (select 1 from public.events where image_media_id=candidate_id and status='published')
  or exists (select 1 from public.gallery_items where media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.site_settings where setting_key in ('og_image','favicon_media_id') and is_public=true and setting_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' and setting_value::uuid=candidate_id);
$$;

comment on function public.record_cms_revision(text,uuid,jsonb,text,text) is 'Role-checked, serialized CMS revision and audit insertion. Snapshots contain validated CMS fields only.';
comment on function public.record_auth_activity(text) is 'Records login/logout for auth.uid() without credential, token, or user-supplied metadata.';
commit;
