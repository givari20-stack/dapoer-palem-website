-- Secure public reservation submission, reservation auditing, and public media
-- references used by SEO settings. No business values are seeded here.

begin;

create or replace function public.submit_reservation(
  p_name text,
  p_phone text,
  p_reservation_date date,
  p_reservation_time time,
  p_guest_count integer,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation_id uuid;
  reservations_enabled boolean;
begin
  select case
    when setting_value is null then true
    when lower(btrim(setting_value)) = 'false' then false
    else true
  end
  into reservations_enabled
  from public.site_settings
  where setting_key = 'reservation_enabled'
    and is_public = true;

  if coalesce(reservations_enabled, true) = false then
    raise exception using errcode = 'P0001', message = 'RESERVATIONS_DISABLED';
  end if;
  if p_name is null or char_length(btrim(p_name)) < 1 or char_length(btrim(p_name)) > 120 then
    raise exception using errcode = '22023', message = 'INVALID_NAME';
  end if;
  if p_phone is null or char_length(btrim(p_phone)) < 7 or char_length(btrim(p_phone)) > 30
    or btrim(p_phone) !~ '^[0-9+(). -]+$' then
    raise exception using errcode = '22023', message = 'INVALID_PHONE';
  end if;
  if p_reservation_date is null or p_reservation_date < current_date then
    raise exception using errcode = '22023', message = 'INVALID_RESERVATION_DATE';
  end if;
  if p_guest_count is null or p_guest_count < 1 or p_guest_count > 100 then
    raise exception using errcode = '22023', message = 'INVALID_GUEST_COUNT';
  end if;
  if p_notes is not null and char_length(btrim(p_notes)) > 1000 then
    raise exception using errcode = '22023', message = 'INVALID_NOTES';
  end if;

  insert into public.reservations (
    name, phone, reservation_date, reservation_time, guest_count, notes
  ) values (
    btrim(p_name), btrim(p_phone), p_reservation_date, p_reservation_time,
    p_guest_count, nullif(btrim(p_notes), '')
  ) returning id into reservation_id;

  return reservation_id;
end;
$$;

revoke all on function public.submit_reservation(text, text, date, time, integer, text)
  from public;
grant execute on function public.submit_reservation(text, text, date, time, integer, text)
  to anon, authenticated;

create or replace function private.audit_reservation_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'reservation_status_changed',
      'reservations',
      new.id,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

revoke all on function private.audit_reservation_status_change() from public, anon, authenticated;

drop trigger if exists reservations_audit_status_change on public.reservations;
create trigger reservations_audit_status_change
after update of status on public.reservations
for each row execute function private.audit_reservation_status_change();

create index if not exists reservations_date_time_idx
  on public.reservations (reservation_date desc, reservation_time desc);
create index if not exists reservations_status_idx
  on public.reservations (status);

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
    where image_media_id = candidate_id and status = 'published'
      and (start_date is null or start_date <= now())
      and (end_date is null or end_date >= now())
  ) or exists (
    select 1 from public.events
    where image_media_id = candidate_id and status = 'published'
  ) or exists (
    select 1 from public.gallery_items
    where media_id = candidate_id and status = 'published' and active = true
  ) or exists (
    select 1 from public.site_settings
    where setting_key in ('og_image', 'favicon_media_id')
      and is_public = true
      and setting_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and setting_value::uuid = candidate_id
  );
$$;

comment on function public.submit_reservation(text, text, date, time, integer, text) is
  'Validated, narrowly scoped public reservation submission. It grants no reservation reads or general table writes.';
comment on function private.audit_reservation_status_change() is
  'Records authenticated reservation status changes without granting direct audit-log writes.';

commit;
