-- Fixed-shape About page content with existing CMS roles, revisions, and private media references. No content is seeded.
begin;

create table public.about_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null default 'about' unique check (content_key = 'about'),
  eyebrow text,
  heading text not null,
  description text,
  supporting_text text,
  image_media_id uuid references public.media (id) on delete restrict,
  cta_label text,
  cta_url text,
  active boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger about_content_set_updated_at before update on public.about_content
for each row execute function public.set_updated_at();
create trigger about_content_set_actor before insert or update on public.about_content
for each row execute function private.set_cms_actor();

alter table public.about_content enable row level security;
revoke all on table public.about_content from anon, authenticated;
grant select on table public.about_content to anon, authenticated;
grant insert, update, delete on table public.about_content to authenticated;

create policy about_content_public_read on public.about_content for select to anon, authenticated
using (status = 'published' and active = true);
create policy about_content_cms_read on public.about_content for select to authenticated
using ((select private.has_any_role(array['super_admin','content_manager','viewer']::text[])));
create policy about_content_cms_insert on public.about_content for insert to authenticated
with check ((select private.has_any_role(array['super_admin','content_manager']::text[])));
create policy about_content_cms_update on public.about_content for update to authenticated
using ((select private.has_any_role(array['super_admin','content_manager']::text[])))
with check ((select private.has_any_role(array['super_admin','content_manager']::text[])));
create policy about_content_super_admin_delete on public.about_content for delete to authenticated
using ((select private.has_any_role(array['super_admin']::text[])));

drop policy if exists content_revisions_cms_read on public.content_revisions;
create policy content_revisions_cms_read on public.content_revisions for select to authenticated
using ((select private.has_any_role(array['super_admin']::text[])) or ((select private.has_any_role(array['content_manager','viewer']::text[])) and entity_type in ('about_content','homepage_content','homepage_experiences','menu_categories','menu_items','promos','events','gallery_items','media')));

drop policy if exists content_revisions_cms_insert on public.content_revisions;
create policy content_revisions_cms_insert on public.content_revisions for insert to authenticated
with check ((select private.has_any_role(array['super_admin']::text[])) or ((select private.has_any_role(array['content_manager']::text[])) and entity_type in ('about_content','homepage_content','homepage_experiences','menu_categories','menu_items','promos','events','gallery_items','media')));

drop policy if exists audit_logs_content_manager_read on public.audit_logs;
create policy audit_logs_content_manager_read on public.audit_logs for select to authenticated
using ((select private.has_any_role(array['content_manager']::text[])) and entity_type in ('about_content','homepage_content','homepage_experiences','menu_categories','menu_items','promos','events','gallery_items','media'));

create or replace function public.record_cms_revision(p_entity_type text, p_entity_id uuid, p_snapshot jsonb, p_change_summary text, p_action text)
returns public.content_revisions language plpgsql security definer set search_path = '' as $$
declare
  next_version integer;
  revision public.content_revisions;
  allowed_entities constant text[] := array['about_content','homepage_content','homepage_experiences','menu_categories','menu_items','promos','events','gallery_items'];
  allowed_actions constant text[] := array['create','update','save_draft','publish','archive','restore'];
begin
  if auth.uid() is null or not private.has_any_role(array['super_admin','content_manager']::text[]) then raise exception using errcode = '42501', message = 'CMS_PERMISSION_DENIED'; end if;
  if not (p_entity_type = any(allowed_entities)) or not (p_action = any(allowed_actions)) or p_entity_id is null or p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then raise exception using errcode = '22023', message = 'INVALID_REVISION'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_entity_type || ':' || p_entity_id::text, 0));
  select coalesce(max(version), 0) + 1 into next_version from public.content_revisions where entity_type = p_entity_type and entity_id = p_entity_id;
  insert into public.content_revisions (entity_type,entity_id,version,snapshot,change_summary,changed_by) values (p_entity_type,p_entity_id,next_version,p_snapshot,nullif(left(btrim(p_change_summary),240),''),auth.uid()) returning * into revision;
  insert into public.audit_logs (user_id,action,entity_type,entity_id,metadata) values (auth.uid(),p_action,p_entity_type,p_entity_id,jsonb_build_object('version',next_version,'summary',revision.change_summary));
  return revision;
end;
$$;
revoke all on function public.record_cms_revision(text,uuid,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.record_cms_revision(text,uuid,jsonb,text,text) to authenticated;

create or replace function private.is_media_public(candidate_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.about_content where image_media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.homepage_content where image_media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.homepage_experiences where image_media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.menu_items join public.menu_categories on menu_categories.id=menu_items.category_id where menu_items.image_media_id=candidate_id and menu_items.status='published' and menu_items.availability='available' and menu_categories.active=true and menu_categories.status='published')
  or exists (select 1 from public.promos where image_media_id=candidate_id and status='published' and (start_date is null or start_date<=now()) and (end_date is null or end_date>=now()))
  or exists (select 1 from public.events where image_media_id=candidate_id and status='published')
  or exists (select 1 from public.gallery_items where media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.site_settings where setting_key in ('og_image','favicon_media_id') and is_public=true and setting_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' and setting_value::uuid=candidate_id);
$$;

comment on table public.about_content is 'Single fixed-layout About page record; no production content is seeded.';
commit;
