-- Category management and transactional category-aware menu imports. No business data is inserted.
begin;

create or replace function private.reject_duplicate_menu_category_name()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.menu_categories
    where id <> coalesce(new.id, gen_random_uuid())
      and lower(regexp_replace(btrim(name), '\s+', ' ', 'g')) = lower(regexp_replace(btrim(new.name), '\s+', ' ', 'g'))
  ) then
    raise exception using errcode = '23505', message = 'DUPLICATE_CATEGORY_NAME';
  end if;
  return new;
end;
$$;

drop trigger if exists menu_categories_reject_duplicate_name on public.menu_categories;
create trigger menu_categories_reject_duplicate_name
before insert or update of name on public.menu_categories
for each row execute function private.reject_duplicate_menu_category_name();

create or replace function public.category_aware_import_menu_items(p_categories jsonb, p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  category_entry jsonb;
  entry jsonb;
  values_json jsonb;
  category_key text;
  category_id uuid;
  target_id uuid;
  expected_updated_at timestamptz;
  saved_category public.menu_categories;
  saved public.menu_items;
  created_categories integer := 0;
  created_count integer := 0;
  updated_count integer := 0;
  result_items jsonb := '[]'::jsonb;
  snapshot jsonb;
begin
  if auth.uid() is null or not private.has_any_role(array['super_admin','content_manager']::text[]) then
    raise exception using errcode = '42501', message = 'MENU_BULK_PERMISSION_DENIED';
  end if;
  if p_categories is null or jsonb_typeof(p_categories) <> 'array' or jsonb_array_length(p_categories) > 1000
    or p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) < 1 or jsonb_array_length(p_rows) > 1000 then
    raise exception using errcode = '22023', message = 'INVALID_MENU_IMPORT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('menu-category-import', 0));
  for category_entry in select value from jsonb_array_elements(p_categories)
  loop
    category_key := nullif(btrim(category_entry->>'key'), '');
    if category_key is null or length(category_key) > 160
      or nullif(btrim(category_entry->>'name'), '') is null or length(btrim(category_entry->>'name')) > 160
      or (category_entry->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(category_entry->>'slug') > 160 then
      raise exception using errcode = '22023', message = 'INVALID_CATEGORY_IMPORT_ROW';
    end if;
    if exists (select 1 from public.menu_categories where slug = category_entry->>'slug')
      or exists (select 1 from public.menu_categories where lower(regexp_replace(btrim(name), '\s+', ' ', 'g')) = category_key) then
      raise exception using errcode = '40001', message = 'CATEGORY_IMPORT_CONFLICT';
    end if;
    insert into public.menu_categories (name,slug,description,display_order,active,status)
    values (btrim(category_entry->>'name'), category_entry->>'slug', null, 0, true, 'draft')
    returning * into saved_category;
    perform public.record_cms_revision(
      'menu_categories', saved_category.id,
      jsonb_build_object('name',saved_category.name,'slug',saved_category.slug,'description',saved_category.description,'image_media_id',saved_category.image_media_id,'display_order',saved_category.display_order,'active',saved_category.active,'status',saved_category.status),
      'Created category by confirmed menu CSV import', 'create'
    );
    created_categories := created_categories + 1;
  end loop;

  for entry in select value from jsonb_array_elements(p_rows)
  loop
    values_json := entry->'values';
    target_id := nullif(entry->>'id','')::uuid;
    expected_updated_at := nullif(entry->>'expected_updated_at','')::timestamptz;
    if values_json is null or jsonb_typeof(values_json) <> 'object' then
      raise exception using errcode = '22023', message = 'INVALID_MENU_IMPORT_ROW';
    end if;
    if nullif(btrim(values_json->>'name'),'') is null or length(btrim(values_json->>'name')) > 160
      or (values_json->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(values_json->>'slug') > 160
      or length(coalesce(values_json->>'description','')) > 2000
      or length(coalesce(values_json->>'sku','')) > 100 or length(coalesce(values_json->>'badge','')) > 80
      or (values_json->>'availability') not in ('available','unavailable')
      or (values_json->>'status') not in ('draft','published','archived')
      or (values_json->>'featured') not in ('true','false')
      or (values_json->>'price') !~ '^[0-9]+([.][0-9]+)?$' or (values_json->>'price')::numeric < 0
      or (nullif(values_json->>'original_price','') is not null and ((values_json->>'original_price') !~ '^[0-9]+([.][0-9]+)?$' or (values_json->>'original_price')::numeric < 0))
      or (values_json->>'display_order') !~ '^[0-9]+$' then
      raise exception using errcode = '22023', message = 'INVALID_MENU_IMPORT_ROW';
    end if;
    category_id := nullif(values_json->>'category_id','')::uuid;
    if category_id is null then
      category_key := nullif(values_json->>'category_key','');
      select id into category_id from public.menu_categories
      where lower(regexp_replace(btrim(name), '\s+', ' ', 'g')) = category_key;
    end if;
    if category_id is null then raise exception using errcode = '23503', message = 'UNRESOLVED_MENU_CATEGORY'; end if;

    if target_id is null then
      insert into public.menu_items (category_id,name,slug,description,price,original_price,sku,badge,featured,availability,status,display_order)
      values (category_id,values_json->>'name',values_json->>'slug',nullif(values_json->>'description',''),(values_json->>'price')::numeric,nullif(values_json->>'original_price','')::numeric,nullif(values_json->>'sku',''),nullif(values_json->>'badge',''),(values_json->>'featured')::boolean,values_json->>'availability',values_json->>'status',(values_json->>'display_order')::integer)
      returning * into saved;
      created_count := created_count + 1;
    else
      update public.menu_items set category_id=category_id,name=values_json->>'name',slug=values_json->>'slug',description=nullif(values_json->>'description',''),price=(values_json->>'price')::numeric,original_price=nullif(values_json->>'original_price','')::numeric,sku=nullif(values_json->>'sku',''),badge=nullif(values_json->>'badge',''),featured=(values_json->>'featured')::boolean,availability=values_json->>'availability',status=values_json->>'status',display_order=(values_json->>'display_order')::integer
      where id=target_id and expected_updated_at is not null and updated_at=expected_updated_at returning * into saved;
      if not found then raise exception using errcode = '40001', message = 'BULK_MENU_CONFLICT'; end if;
      updated_count := updated_count + 1;
    end if;
    snapshot := jsonb_build_object('name',saved.name,'slug',saved.slug,'category_id',saved.category_id,'description',saved.description,'price',saved.price,'original_price',saved.original_price,'image_media_id',saved.image_media_id,'badge',saved.badge,'sku',saved.sku,'display_order',saved.display_order,'featured',saved.featured,'availability',saved.availability,'status',saved.status);
    perform public.record_cms_revision('menu_items',saved.id,snapshot,case when target_id is null then 'Created menu item by CSV import' else 'Updated menu item by confirmed CSV import' end,case when target_id is null then 'create' else 'update' end);
    result_items := result_items || jsonb_build_array(to_jsonb(saved));
  end loop;
  return jsonb_build_object('categories_created',created_categories,'created',created_count,'updated',updated_count,'items',result_items);
end;
$$;

create or replace function public.bulk_update_menu_categories(p_ids uuid[], p_action text, p_display_order integer default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare target_id uuid; saved public.menu_categories; result_items jsonb := '[]'::jsonb; changed_count integer := 0;
begin
  if auth.uid() is null or not private.has_any_role(array['super_admin','content_manager']::text[]) then raise exception using errcode='42501',message='CATEGORY_BULK_PERMISSION_DENIED'; end if;
  if p_ids is null or cardinality(p_ids)<1 or cardinality(p_ids)>500 or p_action not in ('archive','restore','reorder') or (p_action='reorder' and (p_display_order is null or p_display_order<0)) then raise exception using errcode='22023',message='INVALID_CATEGORY_BULK_UPDATE'; end if;
  foreach target_id in array p_ids loop
    update public.menu_categories set
      status=case p_action when 'archive' then 'archived' when 'restore' then 'draft' else status end,
      active=case p_action when 'archive' then false when 'restore' then true else active end,
      display_order=case when p_action='reorder' then p_display_order else display_order end
    where id=target_id returning * into saved;
    if not found then raise exception using errcode='P0002',message='CATEGORY_NOT_FOUND'; end if;
    perform public.record_cms_revision('menu_categories',saved.id,jsonb_build_object('name',saved.name,'slug',saved.slug,'description',saved.description,'image_media_id',saved.image_media_id,'display_order',saved.display_order,'active',saved.active,'status',saved.status),case p_action when 'archive' then 'Bulk archived category' when 'restore' then 'Bulk restored category as draft' else 'Bulk changed category display order' end,case when p_action='reorder' then 'update' else p_action end);
    changed_count := changed_count+1; result_items := result_items || jsonb_build_array(to_jsonb(saved));
  end loop;
  return jsonb_build_object('updated',changed_count,'items',result_items);
end;
$$;

revoke all on function public.category_aware_import_menu_items(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.bulk_update_menu_categories(uuid[],text,integer) from public,anon,authenticated;
grant execute on function public.category_aware_import_menu_items(jsonb,jsonb) to authenticated;
grant execute on function public.bulk_update_menu_categories(uuid[],text,integer) to authenticated;

comment on function public.category_aware_import_menu_items(jsonb,jsonb) is 'Atomically creates explicitly approved draft categories and imports server-validated menu items with RLS, revisions, and audit logs.';
comment on function public.bulk_update_menu_categories(uuid[],text,integer) is 'Archives, restores, or reorders categories without deleting or orphaning menu items.';
commit;
