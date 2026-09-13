-- Expand the fixed About CMS record with structured editorial sections.
-- Existing rows and publication state are preserved; no content is seeded.
begin;

create or replace function private.is_valid_about_items(
  candidate jsonb,
  allow_url boolean default false,
  maximum_items integer default null
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  item jsonb;
begin
  if candidate is null or jsonb_typeof(candidate) <> 'array' then
    return false;
  end if;
  if maximum_items is not null and jsonb_array_length(candidate) > maximum_items then
    return false;
  end if;
  for item in select value from jsonb_array_elements(candidate) loop
    if jsonb_typeof(item) <> 'object'
      or jsonb_typeof(item -> 'name') <> 'string'
      or jsonb_typeof(item -> 'description') <> 'string'
      or btrim(item ->> 'name') = ''
      or btrim(item ->> 'description') = ''
      or (item ? 'url' and not allow_url)
      or (item ? 'url' and item -> 'url' <> 'null'::jsonb and jsonb_typeof(item -> 'url') <> 'string')
    then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

alter table public.about_content
  add column overview_heading text,
  add column vision_heading text,
  add column vision_description text,
  add column mission_heading text,
  add column mission_items jsonb not null default '[]'::jsonb,
  add column founder_heading text,
  add column founder_name text,
  add column founder_role text,
  add column founder_description text,
  add column founder_image_media_id uuid references public.media (id) on delete restrict,
  add column brand_identity_heading text,
  add column brand_identity_description text,
  add column audience_heading text,
  add column audience_description text,
  add column offerings_heading text,
  add column offerings_items jsonb not null default '[]'::jsonb,
  add column service_channels_heading text,
  add column service_channels_items jsonb not null default '[]'::jsonb,
  add column seo_title text,
  add column seo_description text,
  add column seo_image_media_id uuid references public.media (id) on delete restrict,
  add constraint about_content_mission_items_valid
    check (private.is_valid_about_items(mission_items, false, 7)),
  add constraint about_content_offerings_items_valid
    check (private.is_valid_about_items(offerings_items, false, null)),
  add constraint about_content_service_channels_items_valid
    check (private.is_valid_about_items(service_channels_items, true, null));

create or replace function private.is_media_public(candidate_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.about_content
    where status = 'published'
      and active = true
      and candidate_id in (image_media_id, founder_image_media_id, seo_image_media_id)
  )
  or exists (select 1 from public.homepage_content where image_media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.homepage_experiences where image_media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.menu_items join public.menu_categories on menu_categories.id=menu_items.category_id where menu_items.image_media_id=candidate_id and menu_items.status='published' and menu_items.availability='available' and menu_categories.active=true and menu_categories.status='published')
  or exists (select 1 from public.promos where image_media_id=candidate_id and status='published' and (start_date is null or start_date<=now()) and (end_date is null or end_date>=now()))
  or exists (select 1 from public.events where image_media_id=candidate_id and status='published')
  or exists (select 1 from public.gallery_items where media_id=candidate_id and status='published' and active=true)
  or exists (select 1 from public.site_settings where setting_key in ('og_image','favicon_media_id') and is_public=true and setting_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' and setting_value::uuid=candidate_id);
$$;

comment on function private.is_valid_about_items(jsonb,boolean,integer) is
  'Validates structured About CMS item arrays without exposing draft content.';

commit;
