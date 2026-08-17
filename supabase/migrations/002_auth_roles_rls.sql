-- Dapoer Palem authentication, role, and RLS foundation.
--
-- All authorization decisions are made in PostgreSQL. Frontend role state may
-- improve the interface later, but it is never an authorization boundary.

begin;

-- Keep policy helpers outside the exposed public schema. Supabase policies can
-- call schema-qualified functions without exposing them through the Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Reads exactly one role: the role belonging to auth.uid(). SECURITY DEFINER
-- avoids recursive evaluation of the profiles RLS policies.
create or replace function private.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select profiles.role
  from public.profiles as profiles
  where profiles.id = (select auth.uid())
  limit 1;
$$;

-- Central role predicate used by policies. Callers supply only a fixed list of
-- accepted roles; the current role is always loaded from profiles in the DB.
create or replace function private.has_any_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.get_current_user_role() = any(allowed_roles),
    false
  );
$$;

revoke all on function private.get_current_user_role() from public, anon, authenticated;
revoke all on function private.has_any_role(text[]) from public, anon, authenticated;
grant execute on function private.has_any_role(text[]) to authenticated;

-- New Auth users always receive the least-privileged application role. Role
-- metadata from the signup request is deliberately ignored.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      'Profile pending'
    ),
    'viewer'
  );

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

create trigger dapoer_palem_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

-- Users may edit their own display name, but only an existing super_admin may
-- change roles. This trigger is the column-level security boundary that RLS
-- alone cannot express with OLD and NEW values.
create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
    and not private.has_any_role(array['super_admin']::text[])
  then
    raise exception 'Only a super administrator may change profile roles.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_profile_role() from public, anon, authenticated;

create trigger profiles_protect_role
before update on public.profiles
for each row execute function private.protect_profile_role();

-- Derive authorship from auth.uid() for direct authenticated Data API writes.
-- Trusted service operations without a user JWT may continue to supply their
-- own actor fields explicitly.
create or replace function private.set_cms_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if actor_id is not null then
      new.created_by = actor_id;
      new.updated_by = actor_id;
    end if;
  else
    new.created_by = old.created_by;
    if actor_id is not null then
      new.updated_by = actor_id;
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.set_media_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if actor_id is not null then
      new.created_by = actor_id;
    end if;
  else
    new.created_by = old.created_by;
  end if;

  return new;
end;
$$;

create or replace function private.set_setting_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is not null then
    new.updated_by = actor_id;
  end if;

  return new;
end;
$$;

create or replace function private.set_revision_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if actor_id is not null then
      new.changed_by = actor_id;
    end if;
  else
    new.changed_by = old.changed_by;
  end if;

  return new;
end;
$$;

revoke all on function private.set_cms_actor() from public, anon, authenticated;
revoke all on function private.set_media_actor() from public, anon, authenticated;
revoke all on function private.set_setting_actor() from public, anon, authenticated;
revoke all on function private.set_revision_actor() from public, anon, authenticated;

create trigger homepage_content_set_actor
before insert or update on public.homepage_content
for each row execute function private.set_cms_actor();

create trigger homepage_experiences_set_actor
before insert or update on public.homepage_experiences
for each row execute function private.set_cms_actor();

create trigger menu_items_set_actor
before insert or update on public.menu_items
for each row execute function private.set_cms_actor();

create trigger promos_set_actor
before insert or update on public.promos
for each row execute function private.set_cms_actor();

create trigger events_set_actor
before insert or update on public.events
for each row execute function private.set_cms_actor();

create trigger gallery_items_set_actor
before insert or update on public.gallery_items
for each row execute function private.set_cms_actor();

create trigger media_set_actor
before insert or update on public.media
for each row execute function private.set_media_actor();

create trigger site_settings_set_actor
before insert or update on public.site_settings
for each row execute function private.set_setting_actor();

create trigger content_revisions_set_actor
before insert or update on public.content_revisions
for each row execute function private.set_revision_actor();

-- Audit writes are available only to trusted service-role code. The actor is
-- taken from the JWT when present; callers cannot submit an arbitrary user_id.
create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_id uuid;
begin
  if p_action is null or btrim(p_action) = '' then
    raise exception 'Audit action is required.'
      using errcode = '22023';
  end if;

  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

revoke all on function public.write_audit_log(text, text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.write_audit_log(text, text, uuid, jsonb)
  to service_role;

-- Reset client-role table privileges before granting only the operations that
-- are governed below. service_role privileges are intentionally unaffected.
revoke all on table
  public.profiles,
  public.media,
  public.homepage_content,
  public.homepage_experiences,
  public.menu_categories,
  public.menu_items,
  public.promos,
  public.events,
  public.gallery_items,
  public.reservations,
  public.site_settings,
  public.content_revisions,
  public.audit_logs
from anon, authenticated;

grant select on table
  public.homepage_content,
  public.homepage_experiences,
  public.menu_categories,
  public.menu_items,
  public.promos,
  public.events,
  public.gallery_items,
  public.site_settings
to anon;

grant select on table
  public.profiles,
  public.media,
  public.homepage_content,
  public.homepage_experiences,
  public.menu_categories,
  public.menu_items,
  public.promos,
  public.events,
  public.gallery_items,
  public.reservations,
  public.site_settings,
  public.content_revisions,
  public.audit_logs
to authenticated;

grant insert, update, delete on table
  public.profiles,
  public.media,
  public.homepage_content,
  public.homepage_experiences,
  public.menu_categories,
  public.menu_items,
  public.promos,
  public.events,
  public.gallery_items,
  public.reservations,
  public.site_settings,
  public.content_revisions
to authenticated;

-- Profiles: self-read/self-edit plus super-admin user and role management.
create policy profiles_read_own
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_super_admin_read_all
on public.profiles
for select
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy profiles_super_admin_insert
on public.profiles
for insert
to authenticated
with check ((select private.has_any_role(array['super_admin']::text[])));

create policy profiles_super_admin_update
on public.profiles
for update
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])))
with check ((select private.has_any_role(array['super_admin']::text[])));

create policy profiles_super_admin_delete
on public.profiles
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

-- Public website reads. Authenticated users retain these same public reads even
-- when they have no CMS role.
create policy homepage_content_public_read
on public.homepage_content
for select
to anon, authenticated
using (status = 'published' and active = true);

create policy homepage_experiences_public_read
on public.homepage_experiences
for select
to anon, authenticated
using (status = 'published' and active = true);

create policy menu_categories_public_read
on public.menu_categories
for select
to anon, authenticated
using (active = true);

create policy menu_items_public_read
on public.menu_items
for select
to anon, authenticated
using (
  status = 'published'
  and availability = 'available'
  and exists (
    select 1
    from public.menu_categories as categories
    where categories.id = menu_items.category_id
      and categories.active = true
  )
);

create policy promos_public_read
on public.promos
for select
to anon, authenticated
using (
  status = 'published'
  and (start_date is null or start_date <= now())
  and (end_date is null or end_date >= now())
);

create policy events_public_read
on public.events
for select
to anon, authenticated
using (status = 'published');

create policy gallery_items_public_read
on public.gallery_items
for select
to anon, authenticated
using (status = 'published' and active = true);

create policy site_settings_public_read
on public.site_settings
for select
to anon, authenticated
using (is_public = true);

-- CMS read access: super_admin and content_manager see all manageable content;
-- viewer sees the same records read-only; reservation_staff receives no CMS
-- privilege beyond the public policies above.
create policy media_cms_read
on public.media
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager', 'viewer']::text[]
)));

create policy homepage_content_cms_read
on public.homepage_content
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager', 'viewer']::text[]
)));

create policy homepage_experiences_cms_read
on public.homepage_experiences
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager', 'viewer']::text[]
)));

create policy menu_categories_cms_read
on public.menu_categories
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager', 'viewer']::text[]
)));

create policy menu_items_cms_read
on public.menu_items
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager', 'viewer']::text[]
)));

create policy promos_cms_read
on public.promos
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager', 'viewer']::text[]
)));

create policy events_cms_read
on public.events
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager', 'viewer']::text[]
)));

create policy gallery_items_cms_read
on public.gallery_items
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager', 'viewer']::text[]
)));

create policy site_settings_cms_read
on public.site_settings
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager', 'viewer']::text[]
)));

-- CMS mutations. Content managers can create, edit, and publish but cannot hard
-- delete. Super administrators retain hard-delete authority where FK safety
-- allows it. Important records should still be archived/deactivated normally.
create policy media_cms_insert
on public.media
for insert
to authenticated
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy media_cms_update
on public.media
for update
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)))
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy media_super_admin_delete
on public.media
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

create policy homepage_content_cms_insert
on public.homepage_content
for insert
to authenticated
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy homepage_content_cms_update
on public.homepage_content
for update
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)))
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy homepage_content_super_admin_delete
on public.homepage_content
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

create policy homepage_experiences_cms_insert
on public.homepage_experiences
for insert
to authenticated
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy homepage_experiences_cms_update
on public.homepage_experiences
for update
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)))
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy homepage_experiences_super_admin_delete
on public.homepage_experiences
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

create policy menu_categories_cms_insert
on public.menu_categories
for insert
to authenticated
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy menu_categories_cms_update
on public.menu_categories
for update
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)))
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy menu_categories_super_admin_delete
on public.menu_categories
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

create policy menu_items_cms_insert
on public.menu_items
for insert
to authenticated
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy menu_items_cms_update
on public.menu_items
for update
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)))
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy menu_items_super_admin_delete
on public.menu_items
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

create policy promos_cms_insert
on public.promos
for insert
to authenticated
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy promos_cms_update
on public.promos
for update
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)))
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy promos_super_admin_delete
on public.promos
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

create policy events_cms_insert
on public.events
for insert
to authenticated
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy events_cms_update
on public.events
for update
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)))
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy events_super_admin_delete
on public.events
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

create policy gallery_items_cms_insert
on public.gallery_items
for insert
to authenticated
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy gallery_items_cms_update
on public.gallery_items
for update
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)))
with check ((select private.has_any_role(
  array['super_admin', 'content_manager']::text[]
)));

create policy gallery_items_super_admin_delete
on public.gallery_items
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

-- Settings are visible to CMS readers, but only super_admin may mutate them.
create policy site_settings_super_admin_insert
on public.site_settings
for insert
to authenticated
with check ((select private.has_any_role(array['super_admin']::text[])));

create policy site_settings_super_admin_update
on public.site_settings
for update
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])))
with check ((select private.has_any_role(array['super_admin']::text[])));

create policy site_settings_super_admin_delete
on public.site_settings
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

-- Reservations remain closed to anonymous clients. A later server endpoint can
-- validate abuse controls and submit through trusted credentials. Staff and
-- super administrators can create/read/update; only super_admin can hard delete.
create policy reservations_staff_read
on public.reservations
for select
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'reservation_staff']::text[]
)));

create policy reservations_staff_insert
on public.reservations
for insert
to authenticated
with check ((select private.has_any_role(
  array['super_admin', 'reservation_staff']::text[]
)));

create policy reservations_staff_update
on public.reservations
for update
to authenticated
using ((select private.has_any_role(
  array['super_admin', 'reservation_staff']::text[]
)))
with check ((select private.has_any_role(
  array['super_admin', 'reservation_staff']::text[]
)));

create policy reservations_super_admin_delete
on public.reservations
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

-- Revisions are readable by CMS readers. Content managers can add revisions
-- only for CMS-managed entity types; changed_by is derived by the trigger.
create policy content_revisions_cms_read
on public.content_revisions
for select
to authenticated
using (
  (select private.has_any_role(array['super_admin']::text[]))
  or (
    (select private.has_any_role(
      array['content_manager', 'viewer']::text[]
    ))
    and entity_type in (
      'homepage_content',
      'homepage_experiences',
      'menu_categories',
      'menu_items',
      'promos',
      'events',
      'gallery_items',
      'media'
    )
  )
);

create policy content_revisions_cms_insert
on public.content_revisions
for insert
to authenticated
with check (
  (select private.has_any_role(array['super_admin']::text[]))
  or (
    (select private.has_any_role(array['content_manager']::text[]))
    and entity_type in (
      'homepage_content',
      'homepage_experiences',
      'menu_categories',
      'menu_items',
      'promos',
      'events',
      'gallery_items',
      'media'
    )
  )
);

create policy content_revisions_super_admin_update
on public.content_revisions
for update
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])))
with check ((select private.has_any_role(array['super_admin']::text[])));

create policy content_revisions_super_admin_delete
on public.content_revisions
for delete
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

-- Audit records cannot be written through table policies. Only the trusted
-- write_audit_log function may insert, and only super_admin may read the trail.
create policy audit_logs_super_admin_read
on public.audit_logs
for select
to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

comment on function private.get_current_user_role() is
  'Returns only auth.uid()''s profile role and bypasses profiles RLS to prevent recursion.';
comment on function private.has_any_role(text[]) is
  'Policy-only role predicate; the caller cannot supply or override the current user identity.';
comment on function private.handle_new_auth_user() is
  'Creates a least-privileged viewer profile for each new Supabase Auth user.';
comment on function public.write_audit_log(text, text, uuid, jsonb) is
  'Trusted service-role audit insertion; user_id is derived from auth.uid() when present.';

commit;
